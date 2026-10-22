import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const DATA_DIR = join(process.cwd(), '.data')
const FILE = join(DATA_DIR, 'reciclaje_api.json')

function load() {
  try {
    return JSON.parse(readFileSync(FILE, 'utf8'))
  } catch {
    return { users: {}, tokens: {} }
  }
}

function persist(data) {
  mkdirSync(DATA_DIR, { recursive: true })
  writeFileSync(FILE, JSON.stringify(data, null, 2))
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = ''
    req.on('data', (chunk) => {
      raw += chunk
    })
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {})
      } catch {
        reject(new Error('JSON inválido'))
      }
    })
    req.on('error', reject)
  })
}

function json(res, status, payload) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(payload))
}

export function localApiPlugin() {
  return {
    name: 'local-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, 'http://localhost')

        if (url.pathname === '/api/sync' && req.method === 'POST') {
          try {
            const body = await readBody(req)
            const { email, points, history, shareToken } = body || {}
            if (!email || typeof shareToken !== 'string' || !shareToken) {
              return json(res, 400, { error: 'Faltan datos del usuario' })
            }
            const normalized = email.toLowerCase().trim()
            const data = load()
            data.users[normalized] = {
              email: normalized,
              points: Number.isFinite(points) ? points : 0,
              history: Array.isArray(history) ? history : [],
              shareToken,
            }
            data.tokens[shareToken] = normalized
            persist(data)
            return json(res, 200, { ok: true })
          } catch (err) {
            return json(res, 400, { error: err.message || 'Datos inválidos' })
          }
        }

        if (url.pathname === '/api/share' && req.method === 'GET') {
          const token = (url.searchParams.get('token') || '').trim()
          if (!token) {
            return json(res, 400, { error: 'Falta el token' })
          }
          const data = load()
          const email = data.tokens[token]
          if (!email) {
            return json(res, 404, { error: 'Comprobante no encontrado' })
          }
          const user = data.users[email]
          if (!user) {
            return json(res, 404, { error: 'Usuario no encontrado' })
          }
          return json(res, 200, {
            email: user.email,
            points: user.points,
            history: user.history || [],
          })
        }

        next()
      })
    },
  }
}