export const SCALE_MAX_KG = 5
export const MAX_DISCOUNT_PCT = 30
export const DISCOUNT_PER_KG = MAX_DISCOUNT_PCT / SCALE_MAX_KG

/** The legacy flow stores weights in milligrams. */
export const MG_PER_KG = 1_000_000

/** Smallest weight that earns a 1 % discount (about 0.167 kg). */
export const MIN_DISCOUNT_KG = 1 / DISCOUNT_PER_KG

/** The same threshold in whole grams, rounded up so any weight at or above it earns 1 %. */
export const MIN_DISCOUNT_GRAMS = Math.ceil(MIN_DISCOUNT_KG * 1000)

/** Display form of the minimum weight, e.g. `167 g`. */
export const MIN_DISCOUNT_LABEL = `${MIN_DISCOUNT_GRAMS} g`

/** Weights (kg) used to illustrate the rule in the UI. */
export const EXAMPLE_WEIGHTS_KG: readonly number[] = [1, 2.5, SCALE_MAX_KG]

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

/** Same rule as `calculateDiscount`, for weights stored in milligrams. Invalid or negative input earns 0 %. */
export function discountForMilligrams(weightMg: number): DiscountResult {
  return calculateDiscount(Number(weightMg) / MG_PER_KG)
}

export type DiscountExample = {
  weightKg: number
  pct: number
}

/** Example rows (weight and resulting percentage) that explain the rule. */
export function discountExamples(weightsKg: readonly number[] = EXAMPLE_WEIGHTS_KG): DiscountExample[] {
  return weightsKg.map((weightKg) => {
    const { weightKg: clamped, pct } = calculateDiscount(weightKg)
    return { weightKg: clamped, pct }
  })
}
