import { gaussian, type Rng } from './rng'

/**
 * Standard-normal draws (z-scores) fed to every sensor tick. The reducer scales them by the
 * per-sensor sigma from the config, which keeps the reducer pure and tests deterministic.
 */
export type TickNoise = {
  hx711: number
  presence: number
  tof: number
  rssi: number
}

export const ZERO_NOISE: TickNoise = { hx711: 0, presence: 0, tof: 0, rssi: 0 }

export function makeTickNoise(rng: Rng): TickNoise {
  return {
    hx711: gaussian(rng),
    presence: gaussian(rng),
    tof: gaussian(rng),
    rssi: gaussian(rng),
  }
}
