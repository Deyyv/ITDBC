import { describe, expect, it } from 'vitest'
import { ZERO_NOISE, makeTickNoise } from './noise'
import { mulberry32 } from './rng'

const SENSORS = ['hx711', 'presence', 'tof', 'rssi'] as const

describe('makeTickNoise', () => {
  it('draws one finite z-score per sensor', () => {
    const noise = makeTickNoise(mulberry32(1))
    for (const sensor of SENSORS) {
      expect(Number.isFinite(noise[sensor])).toBe(true)
    }
  })

  it('is deterministic for a seeded rng', () => {
    expect(makeTickNoise(mulberry32(21))).toEqual(makeTickNoise(mulberry32(21)))
  })

  it('gives each sensor an independent draw', () => {
    const noise = makeTickNoise(mulberry32(4))
    expect(new Set(SENSORS.map((sensor) => noise[sensor])).size).toBe(SENSORS.length)
  })

  it('advances the rng so consecutive ticks differ', () => {
    const rng = mulberry32(9)
    expect(makeTickNoise(rng)).not.toEqual(makeTickNoise(rng))
  })
})

describe('ZERO_NOISE', () => {
  it('is zero for every sensor', () => {
    for (const sensor of SENSORS) {
      expect(ZERO_NOISE[sensor]).toBe(0)
    }
  })
})
