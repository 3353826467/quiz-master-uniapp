import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

// 说明：小程序端不打包 static/libs（mammoth / xlsx / pdfjs 共约 2.8MB，仅 H5/App 使用）。
// 通过 manifest.json → mp-weixin.packOptions.ignore 让微信上传时忽略该目录，
// 而不是构建后删除文件（避免触发运行环境的批量删除保护）。
export default defineConfig({
  plugins: [uni()]
})
