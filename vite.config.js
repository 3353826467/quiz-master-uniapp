import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import { rmSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * 小程序端排除 static/libs（mammoth/xlsx/pdfjs 共 ~2.8MB）
 * 这些浏览器端解析库仅在 H5 / App 使用（见 common/libLoader.js），
 * 微信小程序端 fileparser 会直接提示改用网页版/App，打进包里纯属超重。
 * H5 / App 构建不受影响。
 */
function dropMpUnusedLibs() {
  return {
    name: 'drop-mp-unused-libs',
    enforce: 'post',
    closeBundle() {
      if (process.env.UNI_PLATFORM !== 'mp-weixin') return
      for (const dir of ['dist/build/mp-weixin', 'dist/dev/mp-weixin']) {
        rmSync(resolve(__dirname, dir, 'static/libs'), { recursive: true, force: true })
      }
      console.log('[drop-mp-unused-libs] 已移除 mp-weixin 包内 static/libs（仅 H5/App 使用的解析库）')
    }
  }
}

export default defineConfig({
  plugins: [uni(), dropMpUnusedLibs()]
})
