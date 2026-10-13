#!/usr/bin/env node
/**
 * 把 H5 构建产物 dist/build/h5 同步到 public/（后端静态托管目录）。
 *
 * 说明：这里只做“写入/覆盖”，不做删除 —— 本机环境对批量删除有保护，
 * 覆盖写（fs.writeFileSync 截断写入）不会触发该保护，且对新构建足够。
 */
'use strict'

const fs = require('fs')
const path = require('path')

const SRC = path.resolve(__dirname, '..', 'dist', 'build', 'h5')
const DEST = path.resolve(__dirname, '..', 'public')

function copyRecursive(src, dest) {
  const stat = fs.statSync(src)

  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true })
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry))
    }
    return
  }

  if (fs.existsSync(dest) && fs.statSync(dest).isDirectory()) {
    return
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.copyFileSync(src, dest)
}

function main() {
  if (!fs.existsSync(SRC)) {
    console.error('[sync-public] 未找到构建产物：' + SRC + '，请先执行 npm run build:h5')
    process.exit(1)
  }

  copyRecursive(SRC, DEST)

  let count = 0
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else count += 1
    }
  }
  walk(DEST)

  console.log('[sync-public] 已同步 ' + count + ' 个文件 → public/')
}

main()
