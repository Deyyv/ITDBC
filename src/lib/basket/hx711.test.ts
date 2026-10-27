import { describe, expect, it } from 'vitest'
import { HX711_CONFIG } from './config'
import {
  DEFAULT_CALIBRATION,
  HX711_MAX_COUNT,
  HX711_MIN_COUNT,
  applyDeadband,
  calibrate,
  filteredKg,
  isOverload,
  isStable,
  kgToRaw,
  median,
  pushSample,
  rawToKg,
  sigmaKg,
  tare,
} from './hx711'
import { gaussian, mulberry32 } from './rng'

describe('HX711 conversion', () => {
  it('round-trips kilograms through raw counts', () => {
    for (const kg of [0, 0.25, 1, 2.5, 4.99]) {
      const raw = kgToRaw(kg, DEFAULT_CALIBRATION)
      expect(rawToKg(raw, DEFAULT_CALIBRATION)).toBeCloseTo(kg, 5)
    }
  })

  it('clamps to the signed 24-bit range', () => {
    expect(kgToRaw(1000, DEFAULT_CALIBRATION)).toBe(HX711_MAX_COUNT)
    expect(kgToRaw(-1000, DEFAULT_CALIBRATION)).toBe(HX711_MIN_COUNT)
    expect(HX711_MAX_COUNT).toBe(8_388_607)
    expect(HX711_MIN_COUNT).toBe(-8_388_608)
  })

  it('adds noise before clamping and returns integers', () => {
    const raw = kgToRaw(1, DEFAULT_CALIBRATION, 12.4)
    expect(Number.isInteger(raw)).toBe(true)
    expect(raw).toBe(Math.round(DEFAULT_CALIBRATION.offset + DEFAULT_CALIBRATION.scale + 12.4))
  })
})

describe('tare and calibration', () => {
  it('tare removes a drifted zero', () => {
    const drifted = Array.from({ length: 10 }, () => DEFAULT_CALIBRATION.offset + 1_500)
    const tared = tare(drifted, DEFAULT_CALIBRATION)
    expect(tared.offset).toBe(DEFAULT_CALIBRATION.offset + 1_500)
    expect(rawToKg(drifted[0], tared)).toBeCloseTo(0, 6)
    expect(tared.scale).toBe(DEFAULT_CALIBRATION.scale)
  })

  it('tare without samples keeps the calibration', () => {
    expect(tare([], DEFAULT_CALIBRATION)).toBe(DEFAULT_CALIBRATION)
  })

  it('two-point calibration recovers the scale factor', () => {
    const truth = { offset: 120_000, scale: 215_000 }
    const calibration = calibrate(kgToRaw(0, truth), kgToRaw(1.5, truth), 1.5)
    expect(calibration.offset).toBe(120_000)
    expect(calibration.scale).toBeCloseTo(215_000, 0)
    expect(rawToKg(kgToRaw(3.2, truth), calibration)).toBeCloseTo(3.2, 3)
  })

  it('rejects a non positive calibration mass', () => {
    expect(() => calibrate(0, 100, 0)).toThrow(RangeError)
  })
})

describe('overload', () => {
  it('flags loads above the 5 kg rating only', () => {
    expect(isOverload(5)).toBe(false)
    expect(isOverload(4.99)).toBe(false)
    expect(isOverload(5.01)).toBe(true)
  })

  it('is visible through the raw reading of an excessive load', () => {
    const raw = kgToRaw(6.5, DEFAULT_CALIBRATION)
    expect(isOverload(rawToKg(raw, DEFAULT_CALIBRATION))).toBe(true)
  })
})

describe('filtering', () => {
  it('median ignores a single spike', () => {
    expect(median([1, 100, 2])).toBe(2)
    expect(median([4, 2])).toBe(3)
    expect(median([])).toBe(0)
  })

  it('median-of-3 plus moving average rejects an outlier sample', () => {
    const clean = [1, 1, 1, 1, 1, 1]
    const spiked = [1, 1, 1, 1, 9, 1]
    expect(filteredKg(clean)).toBeCloseTo(1, 9)
    expect(filteredKg(spiked)).toBeCloseTo(1, 9)
  })

  it('keeps only the newest samples in the window', () => {
    let window: number[] = []
    for (let value = 1; value <= 15; value += 1) window = pushSample(window, value)
    expect(window).toHaveLength(HX711_CONFIG.windowSamples)
    expect(window[0]).toBe(6)
    expect(window.at(-1)).toBe(15)
  })

  it('applies a zero dead band', () => {
    expect(applyDeadband(0.003)).toBe(0)
    expect(applyDeadband(-0.004)).toBe(0)
    expect(applyDeadband(0.02)).toBe(0.02)
  })
})

describe('stability', () => {
  const noisyWindow = (kg: number, seed: number, length = 10) => {
    const rng = mulberry32(seed)
    return Array.from({ length }, () =>
      rawToKg(
        kgToRaw(kg, DEFAULT_CALIBRATION, gaussian(rng) * HX711_CONFIG.noiseCounts),
        DEFAULT_CALIBRATION,
      ),
    )
  }

  it('is stable for a quiet load with realistic noise', () => {
    const window = noisyWindow(2.35, 7)
    expect(sigmaKg(window)).toBeLessThan(0.005)
    expect(isStable(window)).toBe(true)
  })

  it('is unstable while the load is still ringing', () => {
    const ringing = [0.4, 2.9, 1.1, 2.6, 1.8, 2.5, 2.1, 2.4, 2.2, 2.35]
    expect(isStable(ringing)).toBe(false)
  })

  it('needs a full second of samples', () => {
    expect(isStable(noisyWindow(1, 3, 6))).toBe(false)
  })

  it('declares 5 g of spread unstable and 4 g stable', () => {
    const wobble = (amplitudeKg: number) =>
      Array.from({ length: 10 }, (_, index) => 1 + (index % 2 === 0 ? amplitudeKg : -amplitudeKg))
    expect(isStable(wobble(0.004))).toBe(true)
    expect(isStable(wobble(0.006))).toBe(false)
  })
})
