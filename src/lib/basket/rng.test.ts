import { describe, expect, it } from 'vitest'
import { gaussian, mulberry32, nextSeed } from './rng'

const draw = (seed: number, count: number) => {
  const rng = mulberry32(seed)
  return Array.from({ length: count }, () => rng())
}

describe('mulberry32', () => {
  it('repeats the same sequence for the same seed', () => {
    expect(draw(42, 8)).toEqual(draw(42, 8))
  })

  it('produces a different sequence for a different seed', () => {
    expect(draw(42, 8)).not.toEqual(draw(43, 8))
  })

  it('stays in [0, 1)', () => {
    for (const value of draw(7, 2000)) {
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })

  it('is roughly uniform', () => {
    const values = draw(11, 5000)
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length
    expect(mean).toBeGreaterThan(0.47)
    expect(mean).toBeLessThan(0.53)
  })
})

describe('gaussian', () => {
  it('is deterministic for a seeded rng', () => {
    expect(gaussian(mulberry32(5))).toBe(gaussian(mulberry32(5)))
  })

  it('has mean near 0 and standard deviation near 1', () => {
    const rng = mulberry32(99)
    const samples = Array.from({ length: 5000 }, () => gaussian(rng))
    const mean = samples.reduce((sum, value) => sum + value, 0) / samples.length
    const variance =
      samples.reduce((sum, value) => sum + (value - mean) ** 2, 0) / samples.length
    expect(Math.abs(mean)).toBeLessThan(0.06)
    expect(Math.sqrt(variance)).toBeGreaterThan(0.94)
    expect(Math.sqrt(variance)).toBeLessThan(1.06)
  })

  it('never returns a non-finite value when the rng yields 0 first', () => {
    const values = [0, 0.25, 0.5]
    let index = 0
    const rng = () => values[index++ % values.length]
    expect(Number.isFinite(gaussian(rng))).toBe(true)
  })
})

describe('nextSeed', () => {
  it('returns a non-negative 31-bit integer', () => {
    const rng = mulberry32(3)
    for (let i = 0; i < 500; i += 1) {
      const seed = nextSeed(rng)
      expect(Number.isInteger(seed)).toBe(true)
      expect(seed).toBeGreaterThanOrEqual(0)
      expect(seed).toBeLessThan(2147483647)
    }
  })

  it('is deterministic for a seeded rng', () => {
    expect(nextSeed(mulberry32(8))).toBe(nextSeed(mulberry32(8)))
  })
})
