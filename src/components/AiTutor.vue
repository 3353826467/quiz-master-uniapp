<template>
  <view class="ai-tutor">
    <!-- 顶部说明 -->
    <view class="ai-head">
      <view class="ai-title">AI 答疑</view>
      <view class="ai-sub">支持文字提问 · 拍照/截图识题 · 上传文档（txt / csv / docx / xlsx / pdf）讲解，记录随账号多端同步</view>
    </view>

    <!-- 未配置 AI 提示 -->
    <view v-if="!configured" class="ai-tip">
      请先在「设置」中开启 AI 功能，并填写 Base URL / API Key / 模型后再使用答疑。
    </view>

    <!-- 附件区 -->
    <view v-if="attachments.length" class="ai-attach">
      <view v-for="(item, i) in attachments" :key="i" class="ai-chip">
        <text class="ai-chip-icon">{{ item.type === 'image' ? '🖼' : '📄' }}</text>
        <text class="ai-chip-name">{{ item.name }}</text>
        <text class="ai-chip-del" @click="removeAttachment(i)">×</text>
      </view>
    </view>

    <!-- 提问输入 -->
    <textarea
      class="form-textarea ai-input"
      v-model="question"
      :placeholder="placeholder"
      :disabled="loading"
      maxlength="2000"
    />

    <!-- 操作按钮 -->
    <view class="ai-actions">
      <button class="btn-secondary ai-act-btn" :disabled="loading" @click="pickImage">🖼 图片</button>
      <button class="btn-secondary ai-act-btn" :disabled="loading" @click="pickDoc">📄 文档</button>
      <button class="btn-primary ai-act-btn ai-send" :disabled="loading || !canSend" @click="send">
        {{ loading ? '思考中…' : '提问' }}
      </button>
    </view>

    <!-- 当前答案 -->
    <view v-if="current" class="ai-answer">
      <view class="ai-block">
        <view class="ai-block-label">问题</view>
        <view class="ai-block-text">{{ current.question || '（图片 / 文档答疑）' }}</view>
      </view>
      <view class="ai-block">
        <view class="ai-block-label">解答</view>
        <view class="ai-block-text ai-answer-text">{{ current.answer }}</view>
      </view>
      <button class="btn-secondary ai-act-btn" @click="copyAnswer">复制答案</button>
    </view>

    <view v-if="loading" class="ai-loading">AI 正在分析你的问题{{ attachments.length ? '与附件' : '' }}，请稍候…</view>

    <!-- 历史记录 -->
    <view class="ai-history">
      <view class="ai-history-head">
        <text class="ai-history-title">答疑记录（{{ chats.length }}）</text>
        <text v-if="chats.length" class="ai-history-clear" @click="clearAll">清空</text>
      </view>

      <view v-if="!chats.length" class="empty-state">
        <view>还没有答疑记录</view>
        <view class="empty-sub">提问后会保存在这里，并随账号同步到其他设备</view>
      </view>

      <view
        v-for="chat in chats"
        :key="chat.id"
        class="ai-history-item"
        @click="viewChat(chat)"
      >
        <view class="ai-history-main">
          <view class="ai-history-q">{{ chat.question || '（图片 / 文档答疑）' }}</view>
          <view class="ai-history-meta">
            <text>{{ formatTime(chat.createdAt) }}</text>
            <text v-if="chat.attachments.length" class="ai-history-att">
              {{ chat.attachments.length }} 个附件
            </text>
          </view>
        </view>
        <text class="ai-history-del" @click.stop="removeChat(chat.id)">删除</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import Storage from '@/common/storage.js'
import AiService from '@/common/ai.js'
import AiAgent from '@/common/aiAgent.js'
import { chooseDocument, readImageBase64, getPlatform } from '@/common/platform.js'
import { toast, formatTime } from '@/common/format.js'

const question = ref('')
const attachments = ref([])
const loading = ref(false)
const current = ref(null)
const chats = ref([])

const isMp = getPlatform() === 'mp-weixin'
const configured = computed(() => AiService.isConfigured())
const canSend = computed(() => !!question.value.trim() || attachments.value.length > 0)
const placeholder = isMp
  ? '输入你的问题（小程序端文档解析仅支持 txt / csv）'
  : '输入你的问题，例如：这道题为什么选 B？/ 帮我总结这份资料的重点'

function refresh() {
  chats.value = Storage.getAiChats()
}
onMounted(refresh)

// ==================== 附件 ====================
async function pickImage() {
  if (!configured.value) return toast('请先在设置中开启并配置 AI')
  try {
    const res = await uni.chooseImage({ count: 3, sourceType: ['album', 'camera'] })
    const list = res.tempFiles && res.tempFiles.length ? res.tempFiles : (res.tempFilePaths || []).map((p) => ({ path: p }))
    for (const f of list) {
      const dataUrl = await readImageBase64(f)
      attachments.value.push({
        type: 'image',
        name: f.name || ('图片' + (attachments.value.length + 1)),
        dataUrl
      })
    }
    toast('已添加 ' + list.length + ' 张图片')
  } catch (e) {
    // 用户取消
  }
}

async function pickDoc() {
  if (!configured.value) return toast('请先在设置中开启并配置 AI')
  try {
    const file = await chooseDocument()
    toast('正在解析文档…')
    const text = await AiAgent.extractDocumentText(file)
    attachments.value.push({ type: 'doc', name: file.name || '文档', text })
    toast('文档解析完成，可开始提问')
  } catch (e) {
    if (e && e.errMsg && String(e.errMsg).includes('cancel')) return
    toast((e && e.message) || '文档解析失败')
  }
}

function removeAttachment(index) {
  attachments.value.splice(index, 1)
}

// ==================== 提问 ====================
async function send() {
  if (!configured.value) return toast('请先在设置中开启并配置 AI')
  if (!canSend.value) return toast('请输入问题或上传图片 / 文档')

  const images = attachments.value.filter((a) => a.type === 'image')
  const docs = attachments.value.filter((a) => a.type === 'doc')
  const askQuestion = question.value.trim()

  loading.value = true
  current.value = null
  try {
    const history = chats.value.slice(0, 3).map((c) => ({ question: c.question, answer: c.answer }))
    const { answer } = await AiAgent.ask({
      question: askQuestion,
      images,
      documents: docs,
      history
    })

    const settings = Storage.getSettings()
    const record = Storage.saveAiChat({
      question: askQuestion,
      answer,
      attachments: AiAgent.summarizeAttachments(attachments.value),
      model: settings.aiModel || ''
    })

    current.value = record
    question.value = ''
    attachments.value = []
    refresh()
    toast('答疑完成')
  } catch (e) {
    toast((e && e.message) || 'AI 答疑失败')
  } finally {
    loading.value = false
  }
}

// ==================== 历史 ====================
function viewChat(chat) {
  current.value = chat
}

function removeChat(id) {
  Storage.deleteAiChat(id)
  if (current.value && current.value.id === id) current.value = null
  refresh()
  toast('已删除该条记录')
}

function clearAll() {
  uni.showModal({
    title: '清空答疑记录',
    content: '将删除本机的全部答疑记录，云端同步后其他设备也会一并清除，确定继续？',
    success: (res) => {
      if (!res.confirm) return
      Storage.clearAiChats()
      current.value = null
      refresh()
      toast('已清空答疑记录')
    }
  })
}

function copyAnswer() {
  if (!current.value || !current.value.answer) return
  uni.setClipboardData({
    data: current.value.answer,
    success: () => toast('答案已复制')
  })
}
</script>

<style scoped>
.ai-tutor {
  padding-bottom: 40rpx;
}
.ai-head {
  margin-bottom: 20rpx;
}
.ai-title {
  font-size: 36rpx;
  font-weight: 700;
  color: var(--text-primary);
}
.ai-sub {
  margin-top: 8rpx;
  font-size: 24rpx;
  line-height: 1.6;
  color: var(--text-secondary);
}
.ai-tip {
  padding: 20rpx 24rpx;
  margin-bottom: 20rpx;
  border-radius: var(--radius-md, 12rpx);
  background: var(--warning-bg);
  color: #92400e;
  font-size: 26rpx;
  line-height: 1.6;
}
.ai-attach {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 16rpx;
}
.ai-chip {
  display: flex;
  align-items: center;
  padding: 8rpx 16rpx;
  margin: 0 12rpx 12rpx 0;
  border-radius: 999rpx;
  background: var(--primary-bg);
  color: var(--primary-dark);
  font-size: 24rpx;
}
.ai-chip-icon {
  margin-right: 8rpx;
}
.ai-chip-name {
  max-width: 320rpx;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.ai-chip-del {
  margin-left: 10rpx;
  font-size: 28rpx;
  color: var(--text-tertiary);
}
.ai-input {
  min-height: 200rpx;
}
.ai-actions {
  display: flex;
  align-items: center;
  margin: 20rpx 0;
}
.ai-act-btn {
  flex: none;
  min-width: 150rpx;
  margin-right: 16rpx;
  padding: 0 24rpx;
  height: 76rpx;
  line-height: 76rpx;
  font-size: 28rpx;
}
.ai-send {
  flex: 1;
  margin-right: 0;
}
.ai-loading {
  padding: 16rpx 0;
  font-size: 26rpx;
  color: var(--text-secondary);
}
.ai-answer {
  padding: 24rpx;
  margin-bottom: 24rpx;
  border-radius: var(--radius-md, 12rpx);
  background: var(--surface);
  box-shadow: var(--shadow-sm);
}
.ai-block {
  margin-bottom: 20rpx;
}
.ai-block-label {
  margin-bottom: 8rpx;
  font-size: 24rpx;
  font-weight: 600;
  color: var(--primary);
}
.ai-block-text {
  font-size: 28rpx;
  line-height: 1.7;
  color: var(--text-primary);
  white-space: pre-wrap;
  word-break: break-word;
}
.ai-answer-text {
  max-height: 800rpx;
  overflow-y: auto;
}
.ai-history-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 8rpx 0 16rpx;
}
.ai-history-title {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--text-primary);
}
.ai-history-clear {
  font-size: 26rpx;
  color: var(--error);
}
.ai-history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 24rpx;
  margin-bottom: 16rpx;
  border-radius: var(--radius-md, 12rpx);
  background: var(--surface);
  box-shadow: var(--shadow-sm);
}
.ai-history-main {
  flex: 1;
  min-width: 0;
}
.ai-history-q {
  font-size: 28rpx;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ai-history-meta {
  margin-top: 8rpx;
  font-size: 22rpx;
  color: var(--text-tertiary);
}
.ai-history-att {
  margin-left: 16rpx;
}
.ai-history-del {
  flex: none;
  margin-left: 16rpx;
  font-size: 24rpx;
  color: var(--error);
}
</style>
