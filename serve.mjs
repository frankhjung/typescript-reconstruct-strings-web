import * as http from 'node:http'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const distDir = path.join(__dirname, 'dist')
const port = Number(process.argv[2] || process.env.PORT || 8080)

/** @type {Record<string, string>} */
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
}

const server = http.createServer(async (req, res) => {
  try {
    const reqUrl = new URL(req.url ?? '/', `http://localhost:${port}`)
    const safePath = path
      .normalize(decodeURIComponent(reqUrl.pathname))
      .replace(/^(\.\.[/\\])+/, '')
    let filePath = path.join(distDir, safePath)

    if (!filePath.startsWith(distDir)) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end('403 Forbidden')
      return
    }

    let stats
    try {
      stats = await fs.stat(filePath)
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end('404 Not Found')
      return
    }

    if (stats.isDirectory()) {
      filePath = path.join(filePath, 'index.html')
    }

    const data = await fs.readFile(filePath)
    const ext = path.extname(filePath).toLowerCase()
    const contentType = mimeTypes[ext] ?? 'application/octet-stream'

    res.writeHead(200, { 'Content-Type': contentType })
    res.end(data)
  } catch {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('500 Internal Server Error')
  }
})

server.listen(port, () => {
  console.log(`Serving dist/ at http://localhost:${port}/`)
})
