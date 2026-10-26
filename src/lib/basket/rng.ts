/** Seeded pseudo random numbers so every simulation is reproducible in tests. */

export type Rng = () => number

/** mulberry32: tiny, fast and good enough for sensor noise and scene jitter. */
export function mulberry32(seed: number): Rng {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Standard normal sample (Box-Muller). */
export function gaussian(rng: Rng): number {
  let u = 0
  while (u === 0) u = rng()
  const v = rng()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

/** Integer seed in [0, 2^31) drawn from an RNG. */
export function nextSeed(rng: Rng): number {
  return Math.floor(rng() * 2147483647)
}
