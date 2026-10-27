import { Redis } from '@upstash/redis'

// Accepts both the Upstash integration names and the legacy Vercel KV ones.
function createRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN
  return url && token ? new Redis({ url, token }) : null
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  const redis = createRedis()
  if (!redis) {
    return res.status(503).json({ error: 'El servicio de comprobantes no está configurado' })
  }

  const body = req.body || {}
  const { email, points, history, shareToken } = body

  if (!email || typeof shareToken !== 'string' || !shareToken) {
    return res.status(400).json({ error: 'Faltan datos del usuario' })
  }

  const user = {
    email: email.toLowerCase().trim(),
    points: Number.isFinite(points) ? points : 0,
    history: Array.isArray(history) ? history : [],
    shareToken,
  }

  try {
    await redis.set(`u:${user.email}`, user)
    await redis.set(`share:${user.shareToken}`, user.email)
  } catch (error) {
    console.error('[api/sync] Redis write failed', error)
    return res.status(502).json({ error: 'No se pudo guardar la entrega' })
  }

  return res.status(200).json({ ok: true })
}
