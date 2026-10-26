import { describe, expect, it } from 'vitest'
import { BIN, MATERIALS, TOF_SENSOR } from './config'
import {
  BIN_CAPACITY_L,
  addVolumeL,
  depositVolumeL,
  fillPct,
  isFull,
  pileHeightMm,
  tofDistanceMm,
} from './fillLevel'

describe('bin capacity', () => {
  it('matches the 264 x 264 x 148 mm inner volume (about 10.3 L)', () => {
    expect(BIN_CAPACITY_L).toBeCloseTo(10.317, 2)
  })

  it('fills in two or three typical deposits', () => {
    for (const material of MATERIALS) {
      const average = depositVolumeL((material.minKg + material.maxKg) / 2, material.litersPerKg)
      expect(material.litersPerKg).toBeGreaterThanOrEqual(1.4)
      expect(material.litersPerKg).toBeLessThanOrEqual(2.2)
      expect(average).toBeGreaterThan(0)
    }
    const pet = MATERIALS.find((material) => material.id === 'pet')
    if (!pet) throw new Error('PET material missing')
    const typical = depositVolumeL((pet.minKg + pet.maxKg) / 2, pet.litersPerKg)
    expect(fillPct(typical * 2)).toBeLessThan(90)
    expect(fillPct(typical * 3)).toBeGreaterThanOrEqual(90)
  })
})

describe('fill percentage', () => {
  it('scales linearly and is clamped', () => {
    expect(fillPct(0)).toBe(0)
    expect(fillPct(BIN_CAPACITY_L / 2)).toBeCloseTo(50, 6)
    expect(fillPct(BIN_CAPACITY_L * 3)).toBe(100)
    expect(fillPct(-4)).toBe(0)
  })

  it('never stores more than the capacity', () => {
    expect(addVolumeL(9, 5)).toBe(BIN_CAPACITY_L)
    expect(addVolumeL(1, 2)).toBe(3)
  })

  it('is full at 90 percent and above', () => {
    expect(isFull(89.9)).toBe(false)
    expect(isFull(90)).toBe(true)
    expect(isFull(100)).toBe(true)
    expect(isFull(fillPct(BIN_CAPACITY_L * 0.9))).toBe(true)
  })
})

describe('VL53L0X distance', () => {
  it('is largest when the bin is empty and shrinks as it fills', () => {
    const empty = tofDistanceMm(0)
    const half = tofDistanceMm(50)
    const full = tofDistanceMm(100)
    expect(empty).toBeGreaterThan(half)
    expect(half).toBeGreaterThan(full)
    expect(full).toBeGreaterThanOrEqual(TOF_SENSOR.minMm)
  })

  it('reports distance to the pile top exactly', () => {
    expect(tofDistanceMm(0)).toBe(184)
    expect(tofDistanceMm(50)).toBe(184 - 74)
    expect(pileHeightMm(100)).toBe(BIN.innerHeightMm)
  })
})
