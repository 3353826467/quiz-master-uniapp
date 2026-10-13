// aiConfig.js - AI 后端代理配置
//
// 安全设计：前端不保存任何 API Key，所有 AI 请求都发给自己的后端，
// 由服务端注入 Authorization 后转发给大模型厂商。
// 服务端密钥配置见 server/.env（复制 server/.env.example 后修改即可开箱使用）。

// 各端使用的后端地址
//   H5      ：同源相对路径（静态页面与接口由同一个服务提供）
//   App     ：线上后端域名（真机无法访问 localhost）
//   小程序  ：线上后端域名（需在 mp 后台配置 request 合法域名）
const BACKEND_BY_PLATFORM = {
  h5: '',
  app: 'https://quizmaster-h5.app.workbuddy.host',
  'mp-weixin': 'https://quizmaster-h5.app.workbuddy.host'
}

function currentPlatform() {
  // #ifdef H5
  return 'h5'
  // #endif
  // #ifdef APP-PLUS
  return 'app'
  // #endif
  // #ifdef MP-WEIXIN
  return 'mp-weixin'
  // #endif
  return 'h5'
}

export const AI_BACKEND = BACKEND_BY_PLATFORM[currentPlatform()] || ''

// AI 接口（相对后端地址）
export const AI_ENDPOINTS = {
  chat: '/api/ai/chat',
  health: '/api/ai/health'
}

export function getAiUrl(path) {
  return AI_BACKEND + path
}
