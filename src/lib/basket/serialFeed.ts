/** Helpers of the pausable serial monitor. */
import type { LogLine } from './types'

/** Lines of the live log that arrived after the last line the paused monitor shows. */
export function countNewLines(live: readonly LogLine[], shown: readonly LogLine[]): number {
  const lastShownId = shown.length > 0 ? shown[shown.length - 1].id : 0
  return live.filter((line) => line.id > lastShownId).length
}
