# 题库大师 · uni-app 版

> 智能刷题背题工具，支持 **题库导入 → 背题刷题 → 错题本 → 学习统计 → AI 答疑** 全流程闭环，
> 邮箱登录后数据多端自动同步。
>
> - 在线体验（H5）：https://quizmaster-h5.app.workbuddy.host/
> - 源码：https://github.com/3353826467/quiz-master-uniapp

基于 **uni-app（Vue3 + Vite）** 独立开发的跨平台刷题背题应用，一套代码同时运行于三个端：

| 端 | 说明 | 运行命令 |
|----|------|----------|
| **网页端 H5** | 浏览器直接打开的 SPA | `npm run dev:h5` |
| **App** | Android / iOS 原生壳（含物理机 / 模拟器 / 真机） | `npm run dev:app` |
| **微信小程序** | 微信开发者工具导入运行 | `npm run dev:mp-weixin` |

> 内置完整功能：题库管理、文本/文件导入、背题刷题（单选/多选/判断/填空/简答 + 进度保存恢复）、
> 收藏夹、错题本、学习统计、**AI 答疑（文字/图片/文档）**、**邮箱登录与多端云同步**、设置。

---

## 0. 技术栈

| 层次 | 技术 |
|---|---|
| 跨端框架 | **uni-app 3**（Vue 3 + Vite 5），一套代码编译 H5 / App / 微信小程序 |
| 前端 | **Vue 3 `<script setup>`**（ref/reactive/computed/watch）、JavaScript ES2020+ |
| 构建 | **Vite 5.2**；自定义 Vite 插件做平台差异化构建；uni 条件编译 `#ifdef H5 / MP-WEIXIN / APP-PLUS` |
| UI | 自研全局样式体系（`common/style.css`）+ 内联 SVG 图标组件，**不引第三方 UI 库**（控制小程序包体积） |
| 数据持久化 | `uni.getStorageSync/setStorageSync` 单库存储；`normalizeDB` 系列做读写两侧结构校验与脏数据兜底 |
| 文件解析 | 按需懒加载 **mammoth**（docx）/ **SheetJS**（xlsx）/ **pdf.js**（pdf），自研 `parser.js` 题型识别 |
| 云端与账号 | **WorkBuddy Cloud Service SDK**：邮箱验证码注册登录、密码登录、忘记密码；整库 JSON 同步（syncUp/syncDown） |
| AI | OpenAI 兼容接口封装（`ai.js`）+ 自研答疑 Agent（`aiAgent.js`，多模态 + 多轮上下文） |
| 工程化 | npm 分平台脚本、Git/GitHub、H5 静态部署、小程序 `packOptions.ignore` 包体积治理（251KB） |

**源码规模**：约 5.2k 行（单页 SPA：`pages/index/index.vue` + 组件 + `common/` 逻辑层，逻辑与 UI 解耦）。

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
- 项目已配置自有小程序 AppID（`src/manifest.json` → `mp-weixin.appid`，当前 `wx7513569c1a5c3e84`）。
  若只是本地预览，可改成 `touristappid`（游客 appid）；真机预览 / 上传发布必须用自己注册且本人为管理员的 AppID。
- ⚠️ **小程序端文档解析限制见第 5 节**。

---

## 4. 构建（生产包）

```bash
npm run build:h5        # 产物：dist/build/h5/        → 部署到任意静态服务器
npm run build:app       # 产物：原生工程              → 用 HBuilderX 云打包 / 本地打包
npm run build:mp-weixin # 产物：dist/build/mp-weixin/ → 微信开发者工具上传
```

> ⚠️ 重复构建前先清空对应产物目录，否则往已存在的 `dist` 覆盖文件可能触发本机环境的批量删除保护导致构建失败：
> ```bash
> cmd //c "rmdir /s /q dist\build\h5"        # 或 dist\build\mp-weixin
> ```
> 小程序端浏览器专用解析库由 `packOptions.ignore` 在**上传时**忽略，实际上传体积约 **251KB**（微信上限 2MB）。

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

### 6.1 AI 答疑 Agent（底部导航「AI答疑」）

基于 `common/aiAgent.js` 的答疑模块，三种提问方式：

| 方式 | 说明 | 要求 |
|---|---|---|
| 文字提问 | 直接问「这道题为什么选 B」 | 任意文本模型 |
| 图片提问 | 拍照/截图识题，走 `image_url` 多模态，一次最多 3 张 | **必须填支持视觉的模型**（如 `gpt-4o-mini` / `gpt-4o`） |
| 文档提问 | 上传 txt/csv/docx/xlsx/pdf，先解析成文本再作为上下文作答 | H5 / App 全格式；小程序端仅 txt/csv |

- 内置「答疑老师」系统提示词：先给结论 → 再给推导步骤 → 最后补易错点，题目类必给「答案 + 解析」
- 保留最近 3 轮对话上下文，可连续追问；单份文档截断 12000 字，防止超出模型上下文窗口
- 答疑记录存进 `aiChats` 集合（只存附件名、不存图片 base64，上限 100 条），**随账号多端同步**

---

## 6.2 账号与多端数据同步

- 登录方式：**邮箱验证码注册/登录**、密码登录、忘记密码重置（云服务 SDK，无需自建后端）
- 同步机制：登录后执行 `pullFromCloud()` —— 云端有数据则覆盖本地，云端为空则把本地首次上传；
  后续数据变更自动 `syncUp` 整库
- 数据范围：题库、错题本、练习会话、统计、设置、答疑记录**全部随账号同步**，换设备进度一致
- 未登录时完全本地可用，登录后无缝接管；小程序端云同步按运行环境降级禁用（`#ifdef` 关闭）

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
│   │   ├── aiAgent.js      # AI 答疑 Agent（文字/图片/文档 + 多轮上下文）
│   │   ├── cloud.js        # 云 SDK 封装（登录、整库同步）
│   │   ├── fileparser.js   # 文档解析（含小程序降级）
│   │   └── style.css       # 全局样式（含状态栏适配）
│   ├── components/
│   │   ├── AiTutor.vue     # AI 答疑界面（附件、提问、答案、历史记录）
│   │   └── AppIcon.vue     # 内联 SVG 图标组件
│   └── pages/index/
│       └── index.vue       # 单页 SPA：6 个主视图 + 底部导航 + 模态框
```

---

## 7.1 项目描述

> **智能刷题背题工具（个人全栈项目）** | 2026.09 — 2026.10
>
> 技术栈：**uni-app + Vue 3 + Vite + JavaScript**，一套代码发布 **H5 / App / 微信小程序** 三端，H5 已部署公网可访问。
>
> - **题库导入**：实现 docx / xlsx / csv / txt / pdf 多格式题库解析导入，自动识别单选、多选、判断、填空、简答五种题型及答案与解析，替代手工录入
> - **刷题链路**：背题模式、答题判分练习模式、收藏夹、错题本（答错自动收录）、学习统计；支持题目/选项乱序、只练错题等策略
> - **多端同步**：基于云服务 SDK 实现邮箱验证码注册登录与整库 JSON 同步，换设备进度一致；设计数据规范化层，保证脏数据与跨端兼容不崩溃
> - **AI 答疑模块**：自研答疑 Agent，支持文字提问、图片识题（视觉模型多模态）与上传文档作答，带多轮上下文与上下文长度保护
> - **工程优化**：小程序端通过条件编译与打包忽略规则剔除浏览器专用库，主包由 3124KB 压缩至 251KB（微信上限 2MB）

---

## 8. 上手建议

1. 首次打开为空题库，会自动注入 **示例题库**，可直接体验背题/刷题。
2. 想快速试全功能 → 跑 **H5**（`npm run dev:h5`），文档解析与 OCR 开箱即用。
3. 想在手机上用 → 跑 **App** 真机；想发到微信 → 跑 **小程序**（注意第 5.1 节文档限制，或用 AI OCR 绕开）。
4. AI 功能先在「设置」里填好 Base URL / Key / Model，点「测试连接」验证后再用。

---

## 9. 工程结构说明（给维护者）

- 整体为单个 Vue3 `<script setup>` 单页组件（`pages/index/index.vue`），视图用
  `state.currentView` + `v-show` 切换，底部导航 6 个入口（首页 / 收藏 / 错题本 / 统计 / AI答疑 / 设置）。
- 逻辑层 `storage / parser / ai / fileparser` 与 UI 解耦，可独立测试与复用。
- 平台 API 统一封装：持久化走 `uni.getStorageSync/setStorageSync`，网络走 `uni.request`，
  文件选择/读取走 `platform.js` 分支；二进制解析库（mammoth/xlsx/pdf.js）保留浏览器
  原生实现，仅在小程序端做降级提示。
