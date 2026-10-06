# 题库大师 · uni-app 版

基于 **uni-app（Vue3 + Vite）** 独立开发的跨平台刷题背题应用，一套代码同时运行于三个端：

| 端 | 说明 | 运行命令 |
|----|------|----------|
| **网页端 H5** | 浏览器直接打开的 SPA | `npm run dev:h5` |
| **App** | Android / iOS 原生壳（含物理机 / 模拟器 / 真机） | `npm run dev:app` |
| **微信小程序** | 微信开发者工具导入运行 | `npm run dev:mp-weixin` |

> 内置完整功能：题库管理、文本/文件导入、背题翻卡、
> 刷题（单选/多选/判断/填空/简答 + 进度保存恢复）、收藏夹、错题本、
> 统计趋势图、AI 解析/判分/OCR、设置。

---

## 1. 环境要求

- **Node.js**：建议 18 / 20 / 22（本工程在 Node 22 下验证）
- **包管理器**：npm（随 Node 自带）
- **HBuilderX**：可选，但 **App 端真机/云打包** 与 **微信小程序端** 推荐配合官方工具使用
- **微信开发者工具**：仅微信小程序端需要
- 网络：首次 `npm install` 需联网拉取 `@dcloudio/*` 依赖

---

## 2. 安装依赖

```bash
cd quiz-master-uniapp
npm install
```

> 依赖较大（含 `@dcloudio` 系列与 `vite`），首次安装需等待数分钟。
> 若安装缓慢可换源：`npm install --registry=https://registry.npmmirror.com`

---

## 3. 运行各端

### 3.1 网页端（H5）
```bash
npm run dev:h5
```
终端会输出一个本地地址（默认 `http://localhost:5173` 或类似），浏览器打开即可。
H5 端 **完整支持** 所有功能，包括 docx / xlsx / pdf 文档解析（通过 `src/static/libs/` 内置库）与 AI OCR。

### 3.2 App 端（Android / iOS）
```bash
npm run dev:app
```
- 此命令会启动 uni-app 编译器并打开 **HBuilderX** 或生成原生工程。
- 连接 Android 手机（开启 USB 调试）或启动模拟器后，在 HBuilderX 中「运行 → 运行到手机或模拟器」。
- App 端同样 **完整支持** docx/xlsx/pdf 解析与 AI OCR（基于 `plus.io` 与内置库）。

### 3.3 微信小程序端
```bash
npm run dev:mp-weixin
```
- 编译产物输出到 `dist/build/mp-weixin/`。
- 用 **微信开发者工具** 导入该目录（选择「导入项目」，目录指到 `dist/build/mp-weixin`）。
- 小程序端使用 `touristappid`（游客 appid），无需自有小程序即可本地预览；
  若要真机预览 / 发布，请在 `src/manifest.json` 的 `mp-weixin.appid` 填入你自己的小程序 AppID。
- ⚠️ **小程序端文档解析限制见第 5 节**。

---

## 4. 构建（生产包）

```bash
npm run build:h5        # 产物：dist/build/h5/        → 部署到任意静态服务器
npm run build:app       # 产物：原生工程              → 用 HBuilderX 云打包 / 本地打包
npm run build:mp-weixin # 产物：dist/build/mp-weixin/ → 微信开发者工具上传
```

---

## 5. 平台差异与已知限制（重要）

### 5.1 文档导入（docx / xlsx / pdf）
解析库 `mammoth` / `xlsx` / `pdf.js` 只能在 **浏览器（H5）/ App（含 WebView 运行时）** 中运行：

| 格式 | H5 | App | 微信小程序 |
|------|----|----|-----------|
| `.txt` / `.csv` | ✅ | ✅ | ✅ |
| `.docx` | ✅ | ✅ | ⚠️ 降级提示 |
| `.xlsx` | ✅ | ✅ | ⚠️ 降级提示 |
| `.pdf` | ✅ | ✅ | ⚠️ 降级提示 |
| 图片 OCR（AI） | ✅ | ✅ | ✅（用 `wx.chooseMedia` 选图） |

> **小程序端遇到 docx/xlsx/pdf 时的处理**：代码（`src/common/fileparser.js` 的 `parseFile`）会
> 捕获非浏览器平台并抛出友好错误，界面提示「该格式请在网页端或 App 中使用，或改用 AI 拍照/OCR 识别」。
> 小程序用户仍可：① 粘贴纯文本导入；② 用 `.txt`/`.csv`；③ 调用 AI 给题目图片做 OCR 后自动转成题库。

### 5.2 文件选择与导出
- **H5**：`input[type=file]` + Blob 下载
- **App**：`plus.io` 文件读写 + 系统分享
- **微信小程序**：`wx.chooseMessageFile`（仅聊天文件）/ `wx.chooseMedia`（图片）/ 导出走 `setClipboardData` 复制到剪贴板

### 5.3 存储
三端统一走 `uni.getStorageSync / uni.setStorageSync`（底层自动映射到
`localStorage` / `plus.storage` / 小程序 `wx.storage`），**无需**关心平台差异。

### 5.4 网络请求（含 AI 调用）
统一封装 `src/common/ai.js` 中的 `uniRequest()`（底层 `uni.request`），
自动在 header 注入正确协议，**不受** H5 的 CORS / 小程序 `urlCheck` 困扰
（小程序端记得在后台配置 request 合法域名，或本地开发关闭 `urlCheck`）。

---

## 6. AI 功能配置

设置页提供 AI（OpenAI 兼容接口）配置：
- **Base URL**：如 `https://api.openai.com/v1` 或自建/中转地址
- **API Key**：你的密钥
- **Model**：如 `gpt-4o-mini`
- **启用开关**：关闭后所有 AI 功能（解析生成、主观题判分、OCR、批量补解析）自动回退到本地规则

支持的能力：AI 一键格式化导入文本、AI 给题目生成解析、AI 主观题语义判分、AI 图片 OCR 识题、批量补全解析。
所有调用均带 JSON 容错修复与失败回退，**网络/密钥异常不会让刷题中断**。

---

## 7. 目录结构

```
quiz-master-uniapp/
├── package.json            # 脚本与依赖（dev:h5/app/mp-weixin 等）
├── vite.config.js          # @dcloudio/vite-plugin-uni
├── src/
│   ├── main.js             # 入口
│   ├── App.vue             # 应用壳
│   ├── index.html          # H5 入口
│   ├── manifest.json       # 三端配置（appid / 路由 / 权限）
│   ├── pages.json          # 单页路由（pages/index/index）
│   ├── uni.scss
│   ├── static/libs/        # mammoth / xlsx / pdf.js（H5/App 文档解析用）
│   ├── common/             # 核心逻辑层（与 UI 解耦）
│   │   ├── parser.js       # 文本题目解析（单选/多选/判断/填空/简答）
│   │   ├── storage.js      # 持久化（题库/收藏/错题/统计/设置）
│   │   ├── format.js       # 工具函数（toast/时间/洗牌/文件保存）
│   │   ├── platform.js     # 平台判断 + 文件选择/读取分支
│   │   ├── libLoader.js    # 按需懒加载解析库
│   │   ├── ai.js           # AI 调用层（uni.request 封装 + OCR 处理）
│   │   ├── fileparser.js   # 文档解析（含小程序降级）
│   │   └── style.css       # 全局样式（含状态栏适配）
│   └── pages/index/
│       └── index.vue       # 单页 SPA：11 个视图 + 底部导航 + 模态框
```

---

## 8. 上手建议

1. 首次打开为空题库，会自动注入 **示例题库**，可直接体验背题/刷题。
2. 想快速试全功能 → 跑 **H5**（`npm run dev:h5`），文档解析与 OCR 开箱即用。
3. 想在手机上用 → 跑 **App** 真机；想发到微信 → 跑 **小程序**（注意第 5.1 节文档限制，或用 AI OCR 绕开）。
4. AI 功能先在「设置」里填好 Base URL / Key / Model，点「测试连接」验证后再用。

---

## 9. 工程结构说明（给维护者）

- 整体为单个 Vue3 `<script setup>` 单页组件（`pages/index/index.vue`），视图用
  `state.currentView` + `v-show` 切换，共 11 个视图 + 底部导航 + 模态框。
- 逻辑层 `storage / parser / ai / fileparser` 与 UI 解耦，可独立测试与复用。
- 平台 API 统一封装：持久化走 `uni.getStorageSync/setStorageSync`，网络走 `uni.request`，
  文件选择/读取走 `platform.js` 分支；二进制解析库（mammoth/xlsx/pdf.js）保留浏览器
  原生实现，仅在小程序端做降级提示。
