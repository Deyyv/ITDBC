export const SCALE_MAX_KG = 5
export const MAX_DISCOUNT_PCT = 30
export const DISCOUNT_PER_KG = MAX_DISCOUNT_PCT / SCALE_MAX_KG

export type DiscountResult = {
  weightKg: number
  pct: number
  capped: boolean
  nextPctAtKg: number | null
}

export function clampWeight(weightKg: number): number {
  const numeric = Number(weightKg)
  if (Number.isNaN(numeric) || numeric === Number.NEGATIVE_INFINITY) return 0
  if (numeric === Number.POSITIVE_INFINITY) return SCALE_MAX_KG
  return Math.min(Math.max(numeric, 0), SCALE_MAX_KG)
}

export function calculateDiscount(weightKg: number): DiscountResult {
  const weight = clampWeight(weightKg)
  const raw = weight * DISCOUNT_PER_KG
  const pct = Math.min(MAX_DISCOUNT_PCT, Math.max(0, Math.floor(raw + 1e-9)))
  const nextPct = pct >= MAX_DISCOUNT_PCT ? null : pct + 1

  return {
    weightKg: weight,
    pct,
    capped: weight >= SCALE_MAX_KG,
    nextPctAtKg: nextPct === null ? null : nextPct / DISCOUNT_PER_KG,
  }
}
