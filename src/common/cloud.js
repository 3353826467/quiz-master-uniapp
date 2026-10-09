/**
 * cloud.js — 云端同步层
 * 基于 WorkBuddy Cloud Service（Auth 邮箱登录 + Database 整库 JSON 同步）
 *
 * publicConfig 来自 cloud-service 激活返回；endpoint 为该应用固定的 release 域名，
 * 由于本应用复用已发布的 H5 应用（appId 不变），域名稳定，可直接内置。
 * publishableKey 非敏感（仅标识应用），可随前端代码发布。
 *
 * 三端说明：
 *  - H5 / App：使用 @tencent-ai/workbuddy-cloud-sdk 根入口，云端登录与同步完整可用。
 *  - 微信小程序：web 邮箱登录在端内不可用，且 SDK 小程序形态需 /miniprogram 子路径，
 *    此处降级为 cloud=null，所有云端操作自动回退到本地存储模式（见 isCloudAvailable）。
 */

// 来自 cloud-service 激活的 publicConfig
const CLOUD_CONFIG = {
  endpoint: 'https://quizmaster-h5.app.workbuddy.host',
  publishableKey: 'wbpk_BwkeYPRwvfPfTqPnMAzyv5_3ycAUAbJy16Rn4GMdl3A6lC4X0OVmF8O'
}

// #ifdef H5 || APP-PLUS
import { createWorkBuddyCloud } from '@tencent-ai/workbuddy-cloud-sdk'
const cloud = createWorkBuddyCloud({
  endpoint: CLOUD_CONFIG.endpoint,
  publishableKey: CLOUD_CONFIG.publishableKey
})
// #endif

// #ifndef H5 || APP-PLUS
const cloud = null
// #endif

let syncInProgress = false
let pendingSync = false
let pendingOtp = null

export function isCloudAvailable() {
  return !!cloud
}

export function getCloudConfig() {
  return CLOUD_CONFIG
}

// ==================== 会话 / 登录态 ====================

export async function getSession() {
  if (!cloud) return { data: null, error: { message: '云端不可用' } }
  return cloud.auth.getSession()
}

export async function getCurrentUser() {
  if (!cloud) return null
  const { data: session } = await cloud.auth.getSession()
  return session && session.user ? session.user : null
}

export function onAuthStateChange(callback) {
  if (!cloud) return function () {}
  return cloud.auth.onAuthStateChange(callback)
}

export async function signInWithPassword(email, password) {
  if (!cloud) return { data: null, error: { message: '云端不可用' } }
  return cloud.auth.signInWithPassword({ email, password })
}

export async function sendEmailCode(email) {
  if (!cloud) return { data: null, error: { message: '云端不可用' } }
  const sent = await cloud.auth.sendOtp({ email })
  if (!sent.error) {
    pendingOtp = {
      email: email,
      verificationId: sent.data.verificationId,
      isExistingUser: sent.data.isExistingUser
    }
  }
  return sent
}

export async function verifyEmailCode(email, code, password) {
  if (!cloud) return { data: null, error: { message: '云端不可用' } }
  if (!pendingOtp || pendingOtp.email !== email) {
    return { data: null, error: { message: '请先获取当前邮箱的验证码' } }
  }
  const completed = await cloud.auth.verifyOtp({
    email: pendingOtp.email,
    verificationId: pendingOtp.verificationId,
    isExistingUser: pendingOtp.isExistingUser,
    token: code,
    password: pendingOtp.isExistingUser ? undefined : password
  })
  if (!completed.error) pendingOtp = null
  return completed
}

export async function resetPasswordForEmail(email) {
  if (!cloud) return { data: null, error: { message: '云端不可用' } }
  return cloud.auth.resetPasswordForEmail(email)
}

export async function signOut() {
  if (!cloud) return { data: null, error: { message: '云端不可用' } }
  pendingOtp = null
  return cloud.auth.signOut()
}

// ==================== 整库同步 ====================

/**
 * 上传整库到云端（每个用户一行，data 为 JSONB）。
 * 并发保护：若正在同步，标记 pending，本次返回 pending:true，结束后自动重试一次。
 */
export async function syncUp(db) {
  if (!cloud) return { ok: false, error: '云端不可用' }
  const { data: session } = await cloud.auth.getSession()
  if (!session) return { ok: false, error: '未登录' }

  if (syncInProgress) {
    pendingSync = true
    return { ok: true, pending: true }
  }
  syncInProgress = true
  try {
    const { data: rows } = await cloud.database
      .from('quiz_user_data')
      .select('id')
      .limit(1)

    const payload = { data: db }
    if (rows && rows.length > 0) {
      const { error } = await cloud.database
        .from('quiz_user_data')
        .update(payload)
        .eq('id', rows[0].id)
      if (error) return { ok: false, error: error.message || '同步失败' }
    } else {
      const { error } = await cloud.database.from('quiz_user_data').insert(payload)
      if (error) return { ok: false, error: error.message || '同步失败' }
    }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: (e && e.message) || '同步失败' }
  } finally {
    syncInProgress = false
    if (pendingSync) {
      pendingSync = false
      syncUp(db)
    }
  }
}

/**
 * 从云端拉取整库。返回 { ok, data, error }，data 为云端 db 对象或 null（云端无数据）。
 */
export async function syncDown() {
  if (!cloud) return { ok: false, error: '云端不可用' }
  const { data: session } = await cloud.auth.getSession()
  if (!session) return { ok: false, error: '未登录' }
  try {
    const { data: rows, error } = await cloud.database
      .from('quiz_user_data')
      .select('data, updated_at')
      .limit(1)
    if (error) return { ok: false, error: error.message || '拉取失败' }
    if (rows && rows.length > 0) {
      return { ok: true, data: rows[0].data || null, updatedAt: rows[0].updated_at }
    }
    return { ok: true, data: null }
  } catch (e) {
    return { ok: false, error: (e && e.message) || '拉取失败' }
  }
}
