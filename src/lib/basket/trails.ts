/**
 * Short rolling histories of the sensors that the machine itself does not buffer (the HX711
 * already ships `telemetry.history`). Pure so the hook only has to feed it.
 */
import { LIMITS } from './config'
import type { BasketTelemetry } from './types'

export type SensorTrails = {
  presenceCm: readonly number[]
  fillPct: readonly number[]
  servoDeg: readonly number[]
  rssiDbm: readonly number[]
}

export const EMPTY_TRAILS: SensorTrails = {
  presenceCm: [],
  fillPct: [],
  servoDeg: [],
  rssiDbm: [],
}

const push = (values: readonly number[], sample: number, max: number): readonly number[] => {
  const next = [...values, sample]
  return next.length > max ? next.slice(next.length - max) : next
}

/** Appends the latest reading of each sensor, keeping only the newest `max` samples. */
export function appendTrails(
  trails: SensorTrails,
  telemetry: BasketTelemetry,
  max: number = LIMITS.maxHistory,
): SensorTrails {
  return {
    presenceCm: push(trails.presenceCm, telemetry.presenceCm, max),
    fillPct: push(trails.fillPct, telemetry.fillPct, max),
    servoDeg: push(trails.servoDeg, telemetry.servoDeg, max),
    rssiDbm: push(trails.rssiDbm, telemetry.rssiDbm, max),
  }
}

/** Wi-Fi quality bucket from the RSSI, with the number of lit bars (0-4). */
export type WifiQuality = { bars: 0 | 1 | 2 | 3 | 4; label: string }

export function wifiQuality(rssiDbm: number): WifiQuality {
  if (rssiDbm >= -55) return { bars: 4, label: 'Excelente' }
  if (rssiDbm >= -65) return { bars: 3, label: 'Buena' }
  if (rssiDbm >= -75) return { bars: 2, label: 'Aceptable' }
  if (rssiDbm >= -85) return { bars: 1, label: 'Débil' }
  return { bars: 0, label: 'Sin señal útil' }
}
