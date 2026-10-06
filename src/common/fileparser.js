// fileparser.js - 多格式题库文档文本提取器（跨端）
// 支持: txt / csv / docx / xlsx / xls (H5/App)；txt / csv (微信小程序)
// doc / pdf 在小程序端受限于运行环境，建议改用网页版 / App 或 AI 图片识题
import { getPlatform, readTextContent, readArrayBuffer } from './platform.js'
import { ensureMammoth, ensureXLSX, ensurePdf } from './libLoader.js'

const SUPPORTED_EXTENSIONS = ['txt', 'text', 'docx', 'doc', 'pdf', 'xlsx', 'xls', 'csv']

function getExtension(fileName) {
  if (!fileName || fileName.indexOf('.') === -1) return ''
  return fileName.split('.').pop().toLowerCase()
}

function isSupported(file) {
  return SUPPORTED_EXTENSIONS.includes(getExtension(file.name || ''))
}

function getSupportedAccept() {
  return '.txt,.text,.docx,.doc,.pdf,.xlsx,.xls,.csv'
}

function getDisplayName(file) {
  return file && file.name ? file.name.replace(/\.[^.]+$/, '') : '未命名题库'
}

function normalizeText(text) {
  return String(text || '')
    .replace(/ /g, ' ')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// 统一入口：file = { name, path, file(仅H5) }
async function parseFile(file) {
  if (!file) throw new Error('未选择文件')
  const ext = getExtension(file.name)
  if (!SUPPORTED_EXTENSIONS.includes(ext)) throw new Error('暂不支持该文件格式')

  const platform = getPlatform()
  const browserPlatform = platform === 'h5' || platform === 'app-plus'

  switch (ext) {
    case 'txt':
    case 'text':
    case 'csv':
      return readTextContent(file)
    case 'docx':
      if (!browserPlatform) throw new Error('小程序端暂不支持解析 .docx，请使用网页版 / App，或改用 AI 图片识题')
      return readDocxFile(file)
    case 'doc':
      throw new Error('暂不支持直接解析 .doc，请先将文件另存为 .docx 后再导入')
    case 'xlsx':
    case 'xls':
      if (!browserPlatform) throw new Error('小程序端暂不支持解析 .xlsx，请使用网页版 / App，或改用 AI 图片识题')
      return readExcelFile(file)
    case 'pdf':
      if (!browserPlatform) throw new Error('小程序端暂不支持解析 .pdf，请使用网页版 / App，或改用 AI 图片识题')
      return readPdfFile(file)
    default:
      throw new Error('暂不支持该文件格式')
  }
}

async function readDocxFile(file) {
  const mammoth = await ensureMammoth()
  if (!mammoth) throw new Error('DOCX 解析库未加载')
  const arrayBuffer = await readArrayBuffer(file)
  const result = await mammoth.extractRawText({ arrayBuffer })
  const text = normalizeText(result.value || '')
  if (!text.trim()) throw new Error('DOCX 文件中未提取到文本')
  return text
}

async function readExcelFile(file) {
  const XLSX = await ensureXLSX()
  if (!XLSX) throw new Error('Excel 解析库未加载')
  const arrayBuffer = await readArrayBuffer(file)
  const workbook = XLSX.read(arrayBuffer, { type: 'array' })
  const parts = []
  workbook.SheetNames.forEach((sheetName) => {
    const sheet = workbook.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' })
    if (!rows.length) return
    parts.push(`### 工作表: ${sheetName}`)
    rows.forEach((row) => {
      const line = (row || []).map((cell) => String(cell).trim()).filter(Boolean).join(' ')
      if (line) parts.push(line)
    })
    parts.push('')
  })
  const text = normalizeText(parts.join('\n'))
  if (!text.trim()) throw new Error('Excel 文件中未提取到文本')
  return text
}

async function readPdfFile(file) {
  const pdfjsLib = await ensurePdf()
  if (!pdfjsLib) throw new Error('PDF 解析库未加载')
  const arrayBuffer = await readArrayBuffer(file)
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const pages = []
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const content = await page.getTextContent()
    const lines = []
    let currentLine = ''
    let lastY = null
    content.items.forEach((item) => {
      const str = item.str || ''
      const y = item.transform ? item.transform[5] : null
      if (lastY !== null && y !== null && Math.abs(y - lastY) > 3) {
        if (currentLine.trim()) lines.push(currentLine.trim())
        currentLine = str
      } else {
        currentLine += (currentLine ? ' ' : '') + str
      }
      lastY = y
    })
    if (currentLine.trim()) lines.push(currentLine.trim())
    pages.push(lines.join('\n'))
  }
  const text = normalizeText(pages.join('\n\n'))
  if (!text.trim()) throw new Error('PDF 文件中未提取到文本')
  return text
}

export default {
  parseFile,
  isSupported,
  getSupportedAccept,
  getDisplayName,
  getExtension
}
