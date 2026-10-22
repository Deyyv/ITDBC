// En desarrollo se activa siempre (sirve la API local, ver server/localApi.js).
// En producción requiere VITE_API_SYNC=1 para sincronizar hacia Upstash.
const SYNC_ENABLED = import.meta.env.VITE_API_SYNC === '1' || import.meta.env.DEV

export async function uploadUser(user) {
  if (!SYNC_ENABLED || !user) return
  try {
    await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    })
  } catch {
    // Mudo: el modo offline sigue funcionando sin conexión
  }
}

export async function fetchShared(token) {
  const res = await fetch(`/api/share?token=${encodeURIComponent(token)}`)
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}))
    const err = new Error(detail.error || 'No se pudo obtener la información')
    err.status = res.status
    throw err
  }
  return res.json()
}