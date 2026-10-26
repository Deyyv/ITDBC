import { describe, expect, it } from 'vitest'
import { LIMITS } from './config'
import { EMPTY_TRAILS, appendTrails, wifiQuality } from './trails'
import type { BasketTelemetry } from './types'

const telemetry = (overrides: Partial<BasketTelemetry> = {}): BasketTelemetry => ({
  hx711Raw: 84_523,
  hx711Kg: 0,
  stable: false,
  sigmaG: 0,
  history: [],
  presenceCm: 10,
  fillPct: 0,
  tofMm: 188,
  servoDeg: 0,
  servoUs: 500,
  rssiDbm: -61,
  uptimeS: 5,
  overload: false,
  ...overrides,
})

describe('appendTrails', () => {
  it('records one sample per sensor without mutating the previous trails', () => {
    const first = appendTrails(EMPTY_TRAILS, telemetry({ presenceCm: 9.5, fillPct: 12, servoDeg: 40, rssiDbm: -58 }))
    expect(first.presenceCm).toEqual([9.5])
    expect(first.fillPct).toEqual([12])
    expect(first.servoDeg).toEqual([40])
    expect(first.rssiDbm).toEqual([-58])
    expect(EMPTY_TRAILS.presenceCm).toEqual([])
  })

  it('keeps only the newest samples', () => {
    let trails = EMPTY_TRAILS
    for (let index = 0; index < LIMITS.maxHistory + 25; index += 1) {
      trails = appendTrails(trails, telemetry({ presenceCm: index }))
    }
    expect(trails.presenceCm).toHaveLength(LIMITS.maxHistory)
    expect(trails.presenceCm[trails.presenceCm.length - 1]).toBe(LIMITS.maxHistory + 24)
    expect(trails.presenceCm[0]).toBe(25)
  })

  it('honours a custom window', () => {
    let trails = EMPTY_TRAILS
    for (let index = 0; index < 10; index += 1) trails = appendTrails(trails, telemetry({ rssiDbm: -index }), 4)
    expect(trails.rssiDbm).toEqual([-6, -7, -8, -9])
  })
})

describe('wifiQuality', () => {
  it('maps the RSSI to bars and a label', () => {
    expect(wifiQuality(-50)).toEqual({ bars: 4, label: 'Excelente' })
    expect(wifiQuality(-61)).toEqual({ bars: 3, label: 'Buena' })
    expect(wifiQuality(-70)).toEqual({ bars: 2, label: 'Aceptable' })
    expect(wifiQuality(-80)).toEqual({ bars: 1, label: 'Débil' })
    expect(wifiQuality(-95).bars).toBe(0)
  })

  it('never lights more bars for a weaker signal', () => {
    let previous = 4
    for (let dbm = -40; dbm >= -100; dbm -= 1) {
      const { bars } = wifiQuality(dbm)
      expect(bars).toBeLessThanOrEqual(previous)
      previous = bars
    }
  })
})
