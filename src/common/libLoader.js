// libLoader.js - 在 H5 / App 平台按需注入浏览器端解析库（mammoth / xlsx / pdfjs）
// 微信小程序不支持这些浏览器库，相关格式解析在 fileparser 中给出友好提示
import { getPlatform } from './platform.js'

let loaded = {
  mammoth: false,
  xlsx: false,
  pdf: false
}

function getLibBase() {
  const platform = getPlatform()
  if (platform === 'h5') {
    // H5 下 static 由 vite 输出到根目录
    return (import.meta.env && import.meta.env.BASE_URL ? import.meta.env.BASE_URL : '/') + 'static/libs/'
  }
  // App 端 webview 中，relative 路径相对页面根
  return 'static/libs/'
}

function loadScript(url) {
  return new Promise((resolve, reject) => {
    // 已存在则直接复用
    const existing = document.querySelector(`script[src="${url}"]`)
    if (existing) {
      if (existing.dataset.loaded === 'true') return resolve()
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('加载解析库失败: ' + url)))
      return
    }
    const script = document.createElement('script')
    script.src = url
    script.onload = () => {
      script.dataset.loaded = 'true'
      resolve()
    }
    script.onerror = () => reject(new Error('加载解析库失败: ' + url))
    document.head.appendChild(script)
  })
}

export async function ensureMammoth() {
  if (loaded.mammoth && window.mammoth) return window.mammoth
  await loadScript(getLibBase() + 'mammoth.browser.min.js')
  loaded.mammoth = true
  return window.mammoth
}

export async function ensureXLSX() {
  if (loaded.xlsx && window.XLSX) return window.XLSX
  await loadScript(getLibBase() + 'xlsx.full.min.js')
  loaded.xlsx = true
  return window.XLSX
}

export async function ensurePdf() {
  if (loaded.pdf && window.pdfjsLib) return window.pdfjsLib
  await loadScript(getLibBase() + 'pdf.min.js')
  const pdfjsLib = window.pdfjsLib
  if (pdfjsLib && pdfjsLib.GlobalWorkerOptions) {
    try {
      pdfjsLib.GlobalWorkerOptions.workerSrc = getLibBase() + 'pdf.worker.min.js'
    } catch (e) {
      // 忽略 worker 设置异常，pdf.js 在部分环境下可降级运行
    }
  }
  loaded.pdf = true
  return pdfjsLib
}
