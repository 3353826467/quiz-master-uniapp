// format.js - 通用工具函数

export function escapeHtml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function escapeAttr(str) {
  if (!str) return ''
  return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

export function formatTime(timestamp) {
  if (!timestamp) return ''
  const now = Date.now()
  const diff = now - timestamp
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
  if (diff < 604800000) return Math.floor(diff / 86400000) + '天前'
  const d = new Date(timestamp)
  return d.getMonth() + 1 + '/' + d.getDate()
}

export function shuffle(arr) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// 轻量 Toast（跨端）
let toastTimer = null
export function toast(message, duration = 2000) {
  if (toastTimer) clearTimeout(toastTimer)
  uni.showToast({ title: String(message), icon: 'none', duration })
  toastTimer = setTimeout(() => {
    uni.hideToast()
    toastTimer = null
  }, duration)
}

// 跨端保存文本文件 / 导出
export function saveTextFile(filename, content) {
  // #ifdef H5
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  toast('已导出文件')
  // #endif

  // #ifndef H5
  // App / 小程序：写入本地文件或复制到剪贴板
  // #ifdef APP-PLUS
  const fs = plus.io.PUBLIC_DOWNLOADS
  const path = fs + '/' + filename
  plus.io.resolveLocalFileSystemURL(
    fs,
    (entry) => {
      entry.getFile(
        filename,
        { create: true, exclusive: false },
        (fileEntry) => {
          fileEntry.createWriter((writer) => {
            writer.write(content)
            toast('已保存到下载目录')
          })
        },
        () => toast('保存失败')
      )
    },
    () => toast('保存失败')
  )
  // #endif

  // #ifdef MP-WEIXIN
  uni.setClipboardData({
    data: content,
    success: () => toast('已复制到剪贴板')
  })
  // #endif
  // #endif
}

// H5 环境下用 FileReader 读取文本 / 二进制
export function readFileTextH5(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result || '')
    reader.onerror = () => reject(new Error('读取文件失败'))
    reader.readAsText(file, 'UTF-8')
  })
}

export function readFileArrayBufferH5(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = () => reject(new Error('读取文件失败'))
    reader.readAsArrayBuffer(file)
  })
}
