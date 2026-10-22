import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  const token = String(req.query.token || '').trim()
  if (!token) {
    return res.status(400).json({ error: 'Falta el token' })
  }

  const email = await redis.get(`share:${token}`)
  if (!email) {
    return res.status(404).json({ error: 'Comprobante no encontrado' })
  }

  const user = await redis.get(`u:${email}`)
  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado' })
  }

  return res.status(200).json({
    email: user.email,
    points: user.points,
    history: user.history || [],
  })
}