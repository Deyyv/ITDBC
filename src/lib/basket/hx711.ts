/**
 * HX711 24-bit ADC + 5 kg bar load cell model.
 *
 * Raw counts = offset + kg * scale + noise, clamped to the signed 24-bit range. The weight shown
 * to users goes through a median-of-3 and a short moving average; stability is declared when the
 * last second of samples has a standard deviation below 5 g.
 */
import { HX711_CONFIG, LOAD_CELL } from './config'

export const HX711_MIN_COUNT = -(2 ** (HX711_CONFIG.bits - 1))
export const HX711_MAX_COUNT = 2 ** (HX711_CONFIG.bits - 1) - 1

export type Hx711Calibration = {
  /** Raw counts with nothing on the load cell. */
  offset: number
  /** Counts per kilogram. */
  scale: number
}

export const DEFAULT_CALIBRATION: Hx711Calibration = {
  offset: HX711_CONFIG.defaultOffset,
  scale: HX711_CONFIG.countsPerKg,
}

const clampCount = (count: number) =>
  Math.min(HX711_MAX_COUNT, Math.max(HX711_MIN_COUNT, Math.round(count)))

/** Raw reading for a given load. `noiseCounts` is added before clamping. */
export function kgToRaw(kg: number, calibration: Hx711Calibration, noiseCounts = 0): number {
  return clampCount(calibration.offset + kg * calibration.scale + noiseCounts)
}

export function rawToKg(raw: number, calibration: Hx711Calibration): number {
  return (raw - calibration.offset) / calibration.scale
}

/** True when the load exceeds the rated capacity of the load cell. */
export function isOverload(kg: number, maxKg: number = LOAD_CELL.maxKg): boolean {
  return kg > maxKg
}

/** Mean of raw samples taken with an empty scale becomes the new zero. */
export function tare(
  emptyRawSamples: readonly number[],
  calibration: Hx711Calibration,
): Hx711Calibration {
  if (emptyRawSamples.length === 0) return calibration
  const mean = emptyRawSamples.reduce((sum, value) => sum + value, 0) / emptyRawSamples.length
  return { ...calibration, offset: Math.round(mean) }
}

/** Two-point calibration: one reading with no load and one with a known mass. */
export function calibrate(
  zeroRaw: number,
  knownRaw: number,
  knownKg: number,
): Hx711Calibration {
  if (knownKg <= 0) throw new RangeError('The calibration mass must be positive')
  return { offset: zeroRaw, scale: (knownRaw - zeroRaw) / knownKg }
}

/* ------------------------------------------------------------------ */
/* Filtering                                                           */
/* ------------------------------------------------------------------ */

const mean = (values: readonly number[]) =>
  values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length

export function median(values: readonly number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle]
}

/** Appends a sample and keeps only the newest `size` values. */
export function pushSample(
  window: readonly number[],
  sample: number,
  size: number = HX711_CONFIG.windowSamples,
): number[] {
  const next = [...window, sample]
  return next.length > size ? next.slice(next.length - size) : next
}

/** Median-of-3 over each of the newest samples, then a moving average of those medians. */
export function filteredKg(samples: readonly number[]): number {
  if (samples.length === 0) return 0
  const medians: number[] = []
  const first = Math.max(0, samples.length - HX711_CONFIG.averageSize)
  for (let end = first; end < samples.length; end += 1) {
    const from = Math.max(0, end - HX711_CONFIG.medianSize + 1)
    medians.push(median(samples.slice(from, end + 1)))
  }
  return mean(medians)
}

/** Population standard deviation of the stored window, in kilograms. */
export function sigmaKg(samples: readonly number[]): number {
  if (samples.length < 2) return 0
  const avg = mean(samples)
  const variance = mean(samples.map((value) => (value - avg) ** 2))
  return Math.sqrt(variance)
}

/** Stable once a full window of samples varies by less than the threshold. */
export function isStable(
  samples: readonly number[],
  thresholdKg: number = HX711_CONFIG.stableSigmaKg,
): boolean {
  return samples.length >= HX711_CONFIG.windowSamples && sigmaKg(samples) < thresholdKg
}

/** Scale-style zero tracking: tiny readings are shown as zero. */
export function applyDeadband(kg: number, bandKg: number = HX711_CONFIG.zeroDeadbandKg): number {
  return Math.abs(kg) < bandKg ? 0 : kg
}
