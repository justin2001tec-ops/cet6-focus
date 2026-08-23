import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { dirname, extname, join, normalize, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'dist')
const base = '/cet6-focus/'
const port = Number(process.env.PORT ?? 4179)
const contentTypes = {
  '.avif': 'image/avif',
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json',
  '.webp': 'image/webp',
}

function safeFilePath(pathname) {
  if (!pathname.startsWith(base)) return null
  const relative = decodeURIComponent(pathname.slice(base.length))
  const candidate = resolve(root, normalize(relative || 'index.html'))
  return candidate.startsWith(`${root}${sep}`) ? candidate : null
}

const server = createServer(async (request, response) => {
  if (request.url === '/') {
    response.writeHead(302, { Location: base })
    response.end()
    return
  }
  const pathname = new URL(request.url ?? '/', 'http://localhost').pathname
  let filePath = safeFilePath(pathname)
  if (!filePath) {
    response.writeHead(404)
    response.end('Not found')
    return
  }
  try {
    let body
    try {
      body = await readFile(filePath)
    } catch {
      if (extname(filePath)) throw new Error('Not found')
      filePath = join(root, 'index.html')
      body = await readFile(filePath)
    }
    response.writeHead(200, { 'Cache-Control': 'no-store', 'Content-Type': contentTypes[extname(filePath)] ?? 'application/octet-stream' })
    response.end(body)
  } catch {
    response.writeHead(404)
    response.end('Not found')
  }
})

server.listen(port, '127.0.0.1', () => {
  console.log(`Pages preview: http://127.0.0.1:${port}${base}`)
})
