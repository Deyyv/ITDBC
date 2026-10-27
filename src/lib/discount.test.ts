import { describe, expect, it } from 'vitest'
import {
  DISCOUNT_PER_KG,
  EXAMPLE_WEIGHTS_KG,
  MAX_DISCOUNT_PCT,
  MG_PER_KG,
  MIN_DISCOUNT_GRAMS,
  MIN_DISCOUNT_KG,
  MIN_DISCOUNT_LABEL,
  SCALE_MAX_KG,
  calculateDiscount,
  clampWeight,
  discountExamples,
  discountForMilligrams,
} from './discount'

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

describe('minimum weight for a discount', () => {
  it('is the weight that earns exactly 1 percent', () => {
    expect(MIN_DISCOUNT_KG).toBeCloseTo(1 / 6)
    expect(calculateDiscount(MIN_DISCOUNT_KG).pct).toBe(1)
    expect(calculateDiscount(MIN_DISCOUNT_KG - 0.001).pct).toBe(0)
  })

  it('rounds up to whole grams so the label never overpromises', () => {
    expect(MIN_DISCOUNT_GRAMS).toBe(167)
    expect(MIN_DISCOUNT_LABEL).toBe('167 g')
    expect(discountForMilligrams(MIN_DISCOUNT_GRAMS * 1000).pct).toBe(1)
    expect(discountForMilligrams((MIN_DISCOUNT_GRAMS - 1) * 1000).pct).toBe(0)
  })
})

describe('discountForMilligrams', () => {
  it('converts milligrams to kilograms before applying the rule', () => {
    expect(discountForMilligrams(0).pct).toBe(0)
    expect(discountForMilligrams(MG_PER_KG).pct).toBe(DISCOUNT_PER_KG)
    expect(discountForMilligrams(2_500_000).pct).toBe(15)
    expect(discountForMilligrams(2_500_000).weightKg).toBe(2.5)
  })

  it('caps at 30 percent from 5 kg on', () => {
    expect(discountForMilligrams(SCALE_MAX_KG * MG_PER_KG).pct).toBe(MAX_DISCOUNT_PCT)
    expect(discountForMilligrams(12 * MG_PER_KG).pct).toBe(MAX_DISCOUNT_PCT)
  })

  it('treats invalid or negative values as no discount', () => {
    expect(discountForMilligrams(-500_000).pct).toBe(0)
    expect(discountForMilligrams(Number.NaN).pct).toBe(0)
    expect(discountForMilligrams(Number.NEGATIVE_INFINITY).pct).toBe(0)
  })

  it('gives the same percentage as the kilogram flow for the same delivery', () => {
    for (const kg of [0.1, 0.5, 1, 2.5, 3.3, 4.99, 5, 8]) {
      expect(discountForMilligrams(kg * MG_PER_KG).pct).toBe(calculateDiscount(kg).pct)
    }
  })
})

describe('discountExamples', () => {
  it('lists 1, 2.5 and 5 kg by default', () => {
    expect(EXAMPLE_WEIGHTS_KG).toEqual([1, 2.5, 5])
    expect(discountExamples()).toEqual([
      { weightKg: 1, pct: 6 },
      { weightKg: 2.5, pct: 15 },
      { weightKg: 5, pct: 30 },
    ])
  })

  it('clamps custom weights to the scale range', () => {
    expect(discountExamples([-1, 9])).toEqual([
      { weightKg: 0, pct: 0 },
      { weightKg: 5, pct: 30 },
    ])
  })
})
