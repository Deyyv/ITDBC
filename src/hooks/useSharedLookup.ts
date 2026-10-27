import { useEffect, useState } from 'react'
import { fetchShared } from '../services/api.js'

export type SharedLookupStatus = 'loading' | 'ok' | 'notfound' | 'error'

/** Public snapshot of a user returned by `/api/share`. */
export type SharedSnapshot = {
  email: string
  points: number
  history: unknown[]
}

export type SharedLookup = {
  status: SharedLookupStatus
  data: SharedSnapshot | null
  retry: () => void
}

const isNotFound = (error: unknown) =>
  typeof error === 'object' && error !== null && 'status' in error && error.status === 404

/** Loads the public share page for a token; `retry` fetches it again. */
export function useSharedLookup(token: string): SharedLookup {
  const [status, setStatus] = useState<SharedLookupStatus>('loading')
  const [data, setData] = useState<SharedSnapshot | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    fetchShared(token)
      .then((res: SharedSnapshot) => {
        if (cancelled) return
        setData(res)
        setStatus('ok')
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setStatus(isNotFound(error) ? 'notfound' : 'error')
      })
    return () => {
      cancelled = true
    }
  }, [token, attempt])

  const retry = () => setAttempt((n) => n + 1)

  return { status, data, retry }
}
