import { useEffect, useState } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

const read = () => typeof window !== 'undefined' && window.matchMedia(QUERY).matches

/** Tracks the user's reduced-motion preference and follows live changes. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(read)

  useEffect(() => {
    const query = window.matchMedia(QUERY)
    const update = () => setReduced(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  return reduced
}
