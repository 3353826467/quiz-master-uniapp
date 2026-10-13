// aiConfig.js - 内置 AI 服务配置
// 说明：应用内置一套可用的 OpenAI 兼容接口，用户无需手动填写 Base URL / API Key / 模型，
// 打开即可使用 AI 功能（题目解析、主观题判分、图片 OCR、AI 答疑）。
// 若用户在「设置 → AI 设置」中自行填写了配置，则优先使用用户配置。

export const BUILTIN_AI = {
  baseUrl: 'https://api.deepseek.com',
  apiKey: 'sk-b9722d361a284ced9e04b3e1db48ef3e',
  model: 'deepseek-flash'
}

// 把用户设置与内置配置合并：空白字段回落内置值
export function resolveAiConfig(settings) {
  const s = settings || {}
  const pick = (value, fallback) =>
    typeof value === 'string' && value.trim() ? value.trim() : fallback

  return {
    baseUrl: pick(s.aiBaseUrl, BUILTIN_AI.baseUrl),
    apiKey: pick(s.aiApiKey, BUILTIN_AI.apiKey),
    model: pick(s.aiModel, BUILTIN_AI.model)
  }
}
