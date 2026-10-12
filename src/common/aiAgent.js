// aiAgent.js - AI 答疑 Agent
// 能力：基于用户的问题 + 上传的图片（视觉模型）+ 上传的文档（txt/csv/docx/xlsx/pdf 解析后）
//       进行答疑，并给出结构化答案。
// 说明：
//   - 复用 ai.js 中用户自己配置的 OpenAI 兼容接口（Base URL / API Key / 模型）。
//   - 图片走多模态 image_url；文档先由 fileparser 解析成文本再作为上下文注入。
//   - 小程序端受运行环境限制，docx/xlsx/pdf 解析不可用（fileparser 会给出友好提示）。

import AiService from './ai.js'
import FileParser from './fileparser.js'

// 单份文档注入模型的最大字符数（避免超出上下文窗口）
const MAX_DOC_CHARS = 12000
// 单次提问携带的历史轮数（保持对话连续性）
const MAX_HISTORY_TURNS = 3

const SYSTEM_PROMPT = [
  '你是「题库大师」内置的一对一答疑老师（AI 答疑 Agent）。',
  '任务：基于用户的问题、上传的图片以及上传的文档内容，给出准确、清晰、有步骤的解答。',
  '回答原则：',
  '1. 优先依据用户提供的图片与文档内容作答；资料不足时再结合通识知识，并说明依据来源。',
  '2. 结构化输出：先给结论，再给推导过程或步骤，最后补充易错点 / 延伸提示。',
  '3. 题目类问题必须给出「答案 + 解析」；概念类问题给出「定义 + 例子」。',
  '4. 不确定之处要明确说明，绝不编造事实、数据或出处。',
  '5. 使用中文回答，语言简洁，善用分点；涉及代码或公式时使用代码块。'
].join('\n')

function truncate(text, max) {
  const str = String(text || '')
  if (str.length <= max) return str
  return str.slice(0, max) + '\n……（内容过长，已截断至前 ' + max + ' 字）'
}

/**
 * 解析文档为纯文本（供答疑使用）
 * @param {Object} file 由 platform.chooseDocument() 返回：{ name, path, file }
 * @returns {Promise<string>}
 */
export async function extractDocumentText(file) {
  if (!file) throw new Error('未选择文件')
  const text = await FileParser.parseFile(file)
  const trimmed = String(text || '').trim()
  if (!trimmed) throw new Error('未能从该文件中提取到文本内容')
  return trimmed
}

export function isConfigured() {
  return AiService.isConfigured()
}

/**
 * 生成附件摘要（用于历史记录展示，不保存原始 base64 / 全文）
 */
export function summarizeAttachments(list) {
  return (list || [])
    .slice(0, 9)
    .map((item) => ({
      type: item && item.type === 'image' ? 'image' : 'doc',
      name: String((item && item.name) || '附件').slice(0, 120)
    }))
}

/**
 * AI 答疑主入口
 * @param {Object} payload
 *   - question   {String}   用户问题
 *   - images     {Array}    [{ name, dataUrl }]，dataUrl 为 data:image/...;base64,...
 *   - documents  {Array}    [{ name, text }]，已解析好的文档文本
 *   - history    {Array}    历史问答 [{ question, answer }]，取最近若干轮作为上下文
 * @returns {Promise<{ answer: String }>}
 */
export async function ask(payload) {
  const input = payload || {}
  const question = String(input.question || '').trim()
  const images = Array.isArray(input.images) ? input.images : []
  const documents = Array.isArray(input.documents) ? input.documents : []
  const history = Array.isArray(input.history) ? input.history : []

  if (!question && images.length === 0 && documents.length === 0) {
    throw new Error('请输入问题，或至少上传一张图片 / 一份文档')
  }

  // ---- 组装用户消息 ----
  const textParts = []

  if (question) {
    textParts.push('【用户问题】\n' + question)
  }

  documents.forEach((doc, index) => {
    const name = (doc && doc.name) || '文档' + (index + 1)
    const body = truncate(doc && doc.text, MAX_DOC_CHARS)
    textParts.push('【上传文档 ' + (index + 1) + '：' + name + '】\n' + body)
  })

  if (documents.length > 0) {
    textParts.push('请优先依据上述文档内容作答；若文档中没有答案，再结合你的知识说明。')
  }

  if (images.length > 0) {
    textParts.push('（另附 ' + images.length + ' 张图片，请结合图片内容理解题意。）')
  }

  const userText = textParts.join('\n\n') || '请阅读我上传的资料并答疑。'

  // ---- 组装 messages ----
  const messages = [{ role: 'system', content: SYSTEM_PROMPT }]

  const recent = history.slice(-MAX_HISTORY_TURNS)
  recent.forEach((turn) => {
    if (turn && turn.question) messages.push({ role: 'user', content: String(turn.question) })
    if (turn && turn.answer) messages.push({ role: 'assistant', content: String(turn.answer).slice(0, 2000) })
  })

  if (images.length > 0) {
    const content = [{ type: 'text', text: userText }]
    images.forEach((img) => {
      if (img && img.dataUrl) {
        content.push({ type: 'image_url', image_url: { url: img.dataUrl } })
      }
    })
    messages.push({ role: 'user', content })
  } else {
    messages.push({ role: 'user', content: userText })
  }

  const answer = await AiService.chat(messages, { temperature: 0.3 })
  return { answer: String(answer || '').trim() }
}

export default {
  ask,
  isConfigured,
  extractDocumentText,
  summarizeAttachments
}
