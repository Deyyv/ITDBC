import { useEffect, useState } from 'react'

const LEGACY_ROUTES = {
  registrar: 'registrar',
  saldo: 'saldo',
  tienda: 'tienda',
  tiendas: 'tienda',
}

const readRoute = () => {
  const h = window.location.hash.replace(/^#/, '')
  const shareMatch = h.match(/^share\/([^/]+)$/)
  if (shareMatch) return { type: 'share', token: decodeURIComponent(shareMatch[1]) }
  if (LEGACY_ROUTES[h]) return { type: LEGACY_ROUTES[h], tab: null }
  return { type: 'home', tab: null }
}

export function useHash() {
  const [route, setRoute] = useState(readRoute)

  useEffect(() => {
    const onHashChange = () => setRoute(readRoute())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const go = (next) => {
    window.location.hash = next
  }

  return [route, go]
}