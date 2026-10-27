import { Redis } from '@upstash/redis'

// Accepts both the Upstash integration names and the legacy Vercel KV ones.
function createRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN
  return url && token ? new Redis({ url, token }) : null
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  const token = String(req.query.token || '').trim()
  if (!token) {
    return res.status(400).json({ error: 'Falta el token' })
  }

  const redis = createRedis()
  if (!redis) {
    return res.status(503).json({ error: 'El servicio de comprobantes no está configurado' })
  }

  let user
  try {
    const email = await redis.get(`share:${token}`)
    if (!email) {
      return res.status(404).json({ error: 'Comprobante no encontrado' })
    }
    user = await redis.get(`u:${email}`)
  } catch (error) {
    console.error('[api/share] Redis read failed', error)
    return res.status(502).json({ error: 'No se pudo consultar el comprobante' })
  }

  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado' })
  }

  return res.status(200).json({
    email: user.email,
    points: user.points,
    history: user.history || [],
  })
}
