import { describe, expect, it } from 'vitest'
import { countNewLines } from './serialFeed'
import type { LogLine } from './types'

const line = (id: number): LogLine => ({ id, t: id * 100, tag: 'ESP32', message: `line ${id}` })

describe('countNewLines', () => {
  it('counts what arrived after the frozen view', () => {
    const live = [1, 2, 3, 4, 5].map(line)
    expect(countNewLines(live, live.slice(0, 3))).toBe(2)
  })

  it('is zero when nothing new arrived', () => {
    const live = [1, 2, 3].map(line)
    expect(countNewLines(live, live)).toBe(0)
  })

  it('counts everything against an empty view', () => {
    expect(countNewLines([1, 2].map(line), [])).toBe(2)
  })

  it('ignores lines trimmed from the front of the live log', () => {
    const live = [4, 5, 6].map(line)
    expect(countNewLines(live, [2, 3, 4].map(line))).toBe(2)
  })
})
