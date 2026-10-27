/**
 * Fill level of the lower bin and the VL53L0X distance that reports it.
 */
import { BIN, TOF_ANCHOR_Y_MM, TOF_SENSOR } from './config'

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/** Inner volume of the bin in litres (about 10.3 L). */
export const BIN_CAPACITY_L =
  (BIN.innerWidthMm * BIN.innerDepthMm * BIN.innerHeightMm) / 1_000_000

/** Volume a deposit adds to the pile. */
export function depositVolumeL(weightKg: number, litersPerKg: number): number {
  return Math.max(0, weightKg) * litersPerKg
}

/** Adds volume without exceeding the bin capacity. */
export function addVolumeL(currentL: number, addedL: number): number {
  return clamp(currentL + addedL, 0, BIN_CAPACITY_L)
}

export function fillPct(volumeL: number): number {
  return clamp((volumeL / BIN_CAPACITY_L) * 100, 0, 100)
}

export function isFull(pct: number, thresholdPct: number = BIN.fullThresholdPct): boolean {
  return pct >= thresholdPct
}

/** Height of the pile above the inner floor, in millimetres. */
export function pileHeightMm(pct: number): number {
  return (clamp(pct, 0, 100) / 100) * BIN.innerHeightMm
}

/** Distance (mm) the VL53L0X reports from the ring to the top of the pile. */
export function tofDistanceMm(pct: number): number {
  const pileTopY = BIN.floorY + pileHeightMm(pct)
  return clamp(TOF_ANCHOR_Y_MM - pileTopY, TOF_SENSOR.minMm, TOF_SENSOR.maxMm)
}
