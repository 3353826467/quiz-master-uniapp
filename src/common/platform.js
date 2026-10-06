// platform.js - 平台判断与文件读取封装（跨端）

export function getPlatform() {
  // 'h5' | 'app-plus' | 'mp-weixin' | 'mp-alipay' ...
  // 优先使用构建期注入，其次运行时探测
  // #ifdef H5
  return 'h5'
  // #endif
  // #ifdef APP-PLUS
  return 'app-plus'
  // #endif
  // #ifdef MP-WEIXIN
  return 'mp-weixin'
  // #endif
  return (typeof process !== 'undefined' && process.env && process.env.UNI_PLATFORM) || 'unknown'
}

// 选择文件：返回 { name, path, file(仅H5) }
export function chooseDocument() {
  return new Promise((resolve, reject) => {
    const platform = getPlatform()
    if (platform === 'mp-weixin') {
      // 小程序从聊天会话选择文件
      uni.chooseMessageFile({
        count: 1,
        type: 'file',
        success: (res) => {
          const f = res.tempFiles[0]
          resolve({ name: f.name, path: f.path, file: null })
        },
        fail: (err) => reject(err)
      })
    } else if (platform === 'app-plus') {
      uni.chooseFile({
        count: 1,
        extension: ['txt', 'text', 'docx', 'doc', 'pdf', 'xlsx', 'xls', 'csv', 'json', 'qbank'],
        success: (res) => {
          const f = res.tempFiles[0]
          resolve({ name: f.name, path: f.path, file: f })
        },
        fail: (err) => reject(err)
      })
    } else {
      // H5
      uni.chooseFile({
        count: 1,
        type: 'all',
        extension: ['.txt', '.text', '.docx', '.doc', '.pdf', '.xlsx', '.xls', '.csv', '.json', '.qbank'],
        success: (res) => {
          const f = res.tempFiles[0]
          resolve({ name: f.name, path: f.path, file: f })
        },
        fail: (err) => reject(err)
      })
    }
  })
}

// 读取文本内容（txt / csv / json / qbank），统一返回字符串
export function readTextContent(file) {
  return new Promise((resolve, reject) => {
    const platform = getPlatform()
    if (platform === 'h5') {
      if (file && file.file) {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target.result || '')
        reader.onerror = () => reject(new Error('读取文件失败'))
        reader.readAsText(file.file, 'UTF-8')
      } else {
        reject(new Error('未获取到文件内容'))
      }
    } else {
      const fsm = uni.getFileSystemManager()
      fsm.readFile({
        filePath: file.path,
        encoding: 'utf-8',
        success: (res) => resolve(res.data),
        fail: () => reject(new Error('读取文件失败'))
      })
    }
  })
}

// 读取为 ArrayBuffer（docx / xlsx / pdf 解析用）
export function readArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const platform = getPlatform()
    if (platform === 'h5') {
      if (file && file.file) {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target.result)
        reader.onerror = () => reject(new Error('读取文件失败'))
        reader.readAsArrayBuffer(file.file)
      } else {
        reject(new Error('未获取到文件内容'))
      }
    } else {
      const fsm = uni.getFileSystemManager()
      fsm.readFile({
        filePath: file.path,
        // 不指定 encoding 即返回 ArrayBuffer
        success: (res) => resolve(res.data),
        fail: () => reject(new Error('读取文件失败'))
      })
    }
  })
}

// 读取图片为 base64 dataURL（AI OCR 用）
export function readImageBase64(pathOrFile) {
  return new Promise((resolve, reject) => {
    const platform = getPlatform()
    if (platform === 'h5') {
      const f = pathOrFile.file || pathOrFile
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target.result)
      reader.onerror = () => reject(new Error('读取图片失败'))
      reader.readAsDataURL(f)
    } else {
      const fsm = uni.getFileSystemManager()
      fsm.readFile({
        filePath: pathOrFile.path || pathOrFile,
        encoding: 'base64',
        success: (res) => {
          const ext = (pathOrFile.path || '').split('.').pop().toLowerCase() || 'jpeg'
          resolve('data:image/' + (ext === 'jpg' ? 'jpeg' : ext) + ';base64,' + res.data)
        },
        fail: () => reject(new Error('读取图片失败'))
      })
    }
  })
}
