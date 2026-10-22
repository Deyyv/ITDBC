import { describe, expect, it } from 'vitest'
import { MAX_DISCOUNT_PCT, calculateDiscount, clampWeight } from './discount'

describe('calculateDiscount', () => {
  it('starts at zero without material', () => {
    expect(calculateDiscount(0).pct).toBe(0)
  })

  it('is proportional to the load cell', () => {
    expect(calculateDiscount(1).pct).toBe(6)
    expect(calculateDiscount(2.5).pct).toBe(15)
    expect(calculateDiscount(4.99).pct).toBe(29)
  })

  it('never exceeds the 30% cap', () => {
    expect(calculateDiscount(5).pct).toBe(MAX_DISCOUNT_PCT)
    expect(calculateDiscount(12).pct).toBe(MAX_DISCOUNT_PCT)
    expect(calculateDiscount(Number.MAX_SAFE_INTEGER).pct).toBe(MAX_DISCOUNT_PCT)
  })

  it('normalizes invalid or negative values', () => {
    expect(calculateDiscount(-4).pct).toBe(0)
    expect(calculateDiscount(Number.NaN).pct).toBe(0)
    expect(clampWeight(Number.POSITIVE_INFINITY)).toBe(5)
  })

  it('exposes the next percentage threshold', () => {
    expect(calculateDiscount(0).nextPctAtKg).toBeCloseTo(1 / 6)
    expect(calculateDiscount(5).nextPctAtKg).toBeNull()
  })
})
