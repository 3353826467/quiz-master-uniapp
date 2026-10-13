#!/usr/bin/env node
/**
 * 题库大师 · 后端服务（零第三方依赖，仅用 Node 原生模块）
 *
 * 职责：
 *   1. 静态托管 public/ 下的 H5 构建产物（含 SPA history 回退）
 *   2. /api/ai/chat：代理转发大模型请求 —— API Key 只存在于服务端，
 *      前端产物中不含任何密钥
 *
 * 密钥配置：复制 server/.env.example 为 server/.env 后按需修改。
 * 启动：PORT=8000 node server/index.js
 */
'use strict'

const http = require('http')
const https = require('https')
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const PUBLIC_DIR = path.join(ROOT, 'public')
const ENV_FILE = path.join(__dirname, '.env')

// ---------------- 环境变量读取（.env 文件 + 进程环境）----------------
function parseEnvFile(file) {
  const result = {}
  try {
    if (!fs.existsSync(file)) return result
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/)
    for (const raw of lines) {
      const line = raw.trim()
      if (!line || line.startsWith('#')) continue
      const idx = line.indexOf('=')
      if (idx === -1) continue
      const key = line.slice(0, idx).trim()
      let value = line.slice(idx + 1).trim()
      value = value.replace(/^["']|["']$/g, '')
      result[key] = value
    }
  } catch (_) {
    /* 读取失败时静默回退到 process.env */
  }
  return result
}

const FILE_ENV = parseEnvFile(ENV_FILE)

function env(key, fallback) {
  const value = process.env[key]
  if (value !== undefined && String(value).trim() !== '') return String(value).trim()
  const fileValue = FILE_ENV[key]
  if (fileValue !== undefined && String(fileValue).trim() !== '') return String(fileValue).trim()
  return fallback
}

const CONFIG = {
  host: env('HOST', '0.0.0.0'),
  port: Number(env('PORT', 8000)),
  maxBodyBytes: Number(env('MAX_BODY_BYTES', 20 * 1024 * 1024)),
  ai: {
    baseUrl: env('OPENAI_BASE_URL', 'https://api.deepseek.com').replace(/\/$/, ''),
    apiKey: env('OPENAI_API_KEY', 'sk-b9722d361a284ced9e04b3e1db48ef3e'),
    model: env('LLM_MODEL', 'deepseek-flash'),
    maxTokens: Number(env('LLM_MAX_TOKENS', 4096)),
    timeoutMs: Number(env('LLM_TIMEOUT', 90)) * 1000
  }
}

// ---------------- 工具 ----------------
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm'
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store'
  })
  res.end(body)
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > limit) {
        reject(new Error('请求体过大'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function sendFile(res, filePath, status) {
  const ext = path.extname(filePath).toLowerCase()
  const type = MIME[ext] || 'application/octet-stream'
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end('404 Not Found')
      return
    }
    res.writeHead(status || 200, {
      'Content-Type': type,
      'Content-Length': data.length
    })
    res.end(data)
  })
}

// ---------------- AI 代理 ----------------
function forwardToModel(payload) {
  return new Promise((resolve, reject) => {
    let target
    try {
      target = new URL(CONFIG.ai.baseUrl + '/chat/completions')
  } catch (_) {
      reject(new Error('OPENAI_BASE_URL 配置不合法'))
      return
    }
    const transport = target.protocol === 'http:' ? http : https
    const body = JSON.stringify({
      model: CONFIG.ai.model,
      messages: payload.messages,
      temperature: typeof payload.temperature === 'number' ? payload.temperature : 0.2,
      max_tokens: CONFIG.ai.maxTokens
    })

    const req = transport.request(
      {
        hostname: target.hostname,
        port: target.port || (target.protocol === 'http:' ? 80 : 443),
        path: target.pathname + target.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + CONFIG.ai.apiKey,
          'Content-Length': Buffer.byteLength(body)
        },
        timeout: CONFIG.ai.timeoutMs
      },
      (res) => {
        let text = ''
        res.setEncoding('utf8')
        res.on('data', (chunk) => (text += chunk))
        res.on('end', () => {
          let json
          try {
            json = JSON.parse(text)
          } catch (_) {
            reject(new Error('上游返回非 JSON：' + text.slice(0, 200)))
            return
          }
          // 推理模型兜底：content 为空时用 reasoning_content
          try {
            const msg = json && json.choices && json.choices[0] && json.choices[0].message
            if (msg && !msg.content && msg.reasoning_content) {
              msg.content = msg.reasoning_content
            }
          } catch (_) {}
          resolve({ status: res.statusCode || 502, json })
        })
      }
    )

    req.on('timeout', () => req.destroy(new Error('上游响应超时')))
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

async function handleAiChat(req, res) {
  let raw
  try {
    raw = await readBody(req, CONFIG.maxBodyBytes)
  } catch (error) {
    return sendJson(res, 413, { error: error.message })
  }

  let payload
  try {
    payload = JSON.parse(raw || '{}')
  } catch (_) {
    return sendJson(res, 400, { error: '请求体不是合法 JSON' })
  }

  if (!payload || !Array.isArray(payload.messages) || payload.messages.length === 0) {
    return sendJson(res, 400, { error: 'messages 不能为空' })
  }

  if (!CONFIG.ai.apiKey) {
    return sendJson(res, 503, { error: '服务端未配置 API Key（server/.env）' })
  }

  try {
    const upstream = await forwardToModel(payload)
    // 透传上游结构，前端解析逻辑保持不变
    return sendJson(res, upstream.status, upstream.json)
  } catch (error) {
    return sendJson(res, 502, { error: 'AI 请求失败：' + error.message })
  }
}

// ---------------- 静态资源 ----------------
function serveStatic(req, res, pathname) {
  const safePath = decodeURIComponent(pathname.split('?')[0] || '/')
  let target = path.normalize(path.join(PUBLIC_DIR, safePath))
  if (!target.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('403 Forbidden')
    return
  }

  fs.stat(target, (err, stat) => {
    if (!err && stat.isDirectory()) {
      target = path.join(target, 'index.html')
    }
    if (fs.existsSync(target)) {
      sendFile(res, target)
      return
    }
    // SPA 回退：未知路径一律返回 index.html
    const indexPath = path.join(PUBLIC_DIR, 'index.html')
    if (fs.existsSync(indexPath)) {
      sendFile(res, indexPath, 200)
      return
    }
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('404 Not Found')
  })
}

// ---------------- 服务器 ----------------
const server = http.createServer((req, res) => {
  // 允许跨域（App/小程序若直连线上域名时不会触发，但保留兜底）
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  const url = req.url || '/'

  if (url === '/api/ai/health' || url.startsWith('/api/ai/health?')) {
    return sendJson(res, 200, {
      ok: !!CONFIG.ai.apiKey,
      provider: CONFIG.ai.baseUrl,
      model: CONFIG.ai.model
    })
  }

  if (url === '/api/ai/chat' || url.startsWith('/api/ai/chat?')) {
    if (req.method !== 'POST') return sendJson(res, 405, { error: '仅支持 POST' })
    return handleAiChat(req, res)
  }

  return serveStatic(req, res, url)
})

server.listen(CONFIG.port, CONFIG.host, () => {
  console.log(`[quiz-master] server listening on http://${CONFIG.host}:${CONFIG.port}`)
  console.log(`[quiz-master] AI provider: ${CONFIG.ai.baseUrl} (model: ${CONFIG.ai.model})`)
})
