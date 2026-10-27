import { useCallback, useState } from 'react'
import { countNewLines } from '../lib/basket/serialFeed'
import type { LogLine } from '../lib/basket/types'

export type SerialFeed = {
  /** Lines to draw: live, or frozen at the moment the feed was paused. */
  lines: readonly LogLine[]
  paused: boolean
  /** Lines that arrived while paused. */
  pending: number
  toggle: () => void
}

/** Pausable view over the firmware log: pausing freezes what is on screen, not the firmware. */
export function useSerialFeed(log: readonly LogLine[]): SerialFeed {
  const [frozen, setFrozen] = useState<readonly LogLine[] | null>(null)

  const toggle = useCallback(() => {
    setFrozen((current) => (current === null ? log : null))
  }, [log])

  const lines = frozen ?? log
  const pending = frozen === null ? 0 : countNewLines(log, lines)

  return { lines, paused: frozen !== null, pending, toggle }
}
