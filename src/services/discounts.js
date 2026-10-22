export const DISCOUNT_TIERS = [
  { minMg: 250000, maxMg: 1000000, pct: 5, label: '0.25 – 1 kg' },
  { minMg: 1000000, maxMg: 3000000, pct: 10, label: '1 – 3 kg' },
  { minMg: 3000000, maxMg: 5000000, pct: 15, label: '3 – 5 kg' },
  { minMg: 5000000, maxMg: null, pct: 25, label: '5 kg o más' },
]

export const MIN_WEIGHT_MG = DISCOUNT_TIERS[0].minMg
export const MIN_WEIGHT_LABEL = '250 g'

export const getDiscountForMg = (mg) => {
  const numeric = Number(mg) || 0
  const tier = DISCOUNT_TIERS.find(
    (t) => numeric >= t.minMg && (t.maxMg === null || numeric < t.maxMg),
  )
  return tier
    ? { pct: tier.pct, label: tier.label, minMg: tier.minMg }
    : { pct: 0, label: null, minMg: MIN_WEIGHT_MG }
}