import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' })
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

  await redis.set(`u:${user.email}`, user)
  await redis.set(`share:${user.shareToken}`, user.email)

  return res.status(200).json({ ok: true })
}