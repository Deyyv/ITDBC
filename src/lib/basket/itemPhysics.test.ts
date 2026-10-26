import { describe, expect, it } from 'vitest'
import { BIN, FLAP, FLAP_HOLE, ITEM_CLEARANCE_MM } from './config'
import {
  PILE_HALF_X,
  PILE_HALF_Z,
  flapSurfaceY,
  pileTarget,
  spawnBody,
  spawnZRange,
  stepBody,
} from './itemPhysics'
import { mulberry32, nextSeed } from './rng'

describe('stepBody', () => {
  const simulate = (floorY: number, seconds: number) => {
    const body = spawnBody(11)
    const startY = body.y
    let peakAfterFirstImpact = 0
    let hasLanded = false
    for (let step = 0; step < seconds * 120; step += 1) {
      stepBody(body, 1 / 120, floorY)
      if (hasLanded) peakAfterFirstImpact = Math.max(peakAfterFirstImpact, body.y)
      if (body.bounces > 0) hasLanded = true
    }
    return { body, startY, peakAfterFirstImpact }
  }

  it('falls, bounces at most twice and comes to rest on the floor', () => {
    const { body, startY, peakAfterFirstImpact } = simulate(180, 4)
    expect(body.resting).toBe(true)
    expect(body.y).toBe(180)
    expect(body.bounces).toBeLessThanOrEqual(2)
    expect(body.bounces).toBeGreaterThan(0)
    expect(peakAfterFirstImpact).toBeLessThan(startY)
  })

  it('starts falling again when the floor disappears', () => {
    const { body } = simulate(180, 4)
    expect(body.resting).toBe(true)
    for (let step = 0; step < 10; step += 1) stepBody(body, 1 / 60, 20)
    expect(body.y).toBeLessThan(180)
    expect(body.resting).toBe(false)
  })

  it('is deterministic for a given seed', () => {
    expect(spawnBody(5)).toEqual(spawnBody(5))
    expect(spawnBody(5)).not.toEqual(spawnBody(6))
  })
})

describe('spawnBody', () => {
  it('never spawns an item over the notch hole of the closed flaps', () => {
    for (const [materialId, clearance] of Object.entries(ITEM_CLEARANCE_MM)) {
      for (let seed = 1; seed <= 400; seed += 1) {
        const body = spawnBody(seed, clearance)
        const insideHole =
          Math.abs(body.x) < FLAP_HOLE.halfXMm + clearance * 0.4 && Math.abs(body.z) < FLAP_HOLE.halfZMm
        expect(insideHole, `${materialId} seed ${seed}`).toBe(false)
        expect(Math.abs(body.z)).toBeGreaterThan(FLAP_HOLE.halfZMm)
      }
    }
  })

  it('keeps items on the flaps, short of the sleeve wall', () => {
    for (const clearance of Object.values(ITEM_CLEARANCE_MM)) {
      const { min, max } = spawnZRange(clearance)
      expect(min).toBeGreaterThan(FLAP_HOLE.halfZMm)
      expect(max).toBeLessThanOrEqual(BIN.innerDepthMm / 2)
      expect(max).toBeGreaterThanOrEqual(min)
      for (let seed = 1; seed <= 200; seed += 1) {
        const z = Math.abs(spawnBody(seed, clearance).z)
        expect(z).toBeGreaterThanOrEqual(min - 1e-9)
        expect(z).toBeLessThanOrEqual(max + 1e-9)
      }
    }
  })

  it('uses both flaps', () => {
    const sides = new Set<number>()
    for (let seed = 1; seed <= 50; seed += 1) sides.add(Math.sign(spawnBody(seed).z))
    expect(sides).toEqual(new Set([-1, 1]))
  })

  it('pushes bigger items further from the hole', () => {
    expect(spawnZRange(ITEM_CLEARANCE_MM.mixta).min).toBeGreaterThan(spawnZRange(ITEM_CLEARANCE_MM.tapas).min)
  })
})

describe('pileTarget', () => {
  it('keeps every slot inside the bin and under the pile top', () => {
    const rng = mulberry32(99)
    for (const pct of [5, 35, 70, 95]) {
      const count = 12
      for (let index = 0; index < count; index += 1) {
        const [x, y, z] = pileTarget(index, count, pct, nextSeed(rng))
        expect(Math.abs(x)).toBeLessThanOrEqual(PILE_HALF_X)
        expect(Math.abs(z)).toBeLessThanOrEqual(PILE_HALF_Z)
        expect(y).toBeGreaterThanOrEqual(BIN.floorY)
        expect(y).toBeLessThanOrEqual(BIN.floorY + BIN.innerHeightMm)
      }
    }
  })

  it('raises the pile with the fill level', () => {
    const average = (pct: number) => {
      let sum = 0
      for (let index = 0; index < 10; index += 1) sum += pileTarget(index, 10, pct, 3 + index)[1]
      return sum / 10
    }
    expect(average(90)).toBeGreaterThan(average(55))
    expect(average(55)).toBeGreaterThan(average(5))
  })

  it('puts newer items higher than older ones on average', () => {
    const lowHalf = [0, 1, 2, 3, 4].map((index) => pileTarget(index, 10, 80, 21 + index)[1])
    const highHalf = [5, 6, 7, 8, 9].map((index) => pileTarget(index, 10, 80, 21 + index)[1])
    const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length
    expect(mean(highHalf)).toBeGreaterThan(mean(lowHalf))
  })
})

describe('flapSurfaceY', () => {
  const rad = (deg: number) => (deg * Math.PI) / 180

  it('is the closed flap top across both flaps and empty past the hinges', () => {
    expect(flapSurfaceY(60, 0, 'walls')).toBe(FLAP.topY)
    expect(flapSurfaceY(-60, 0, 'walls')).toBe(FLAP.topY)
    expect(flapSurfaceY(FLAP.hingeZ + 5, 0, 'walls')).toBeNull()
  })

  it('drops with the opening angle and loses the inner part of the flap first', () => {
    const closed = flapSurfaceY(100, rad(20), 'walls')
    const opener = flapSurfaceY(100, rad(60), 'walls')
    expect(closed).not.toBeNull()
    expect(opener).not.toBeNull()
    expect(opener as number).toBeLessThan(closed as number)
    expect(flapSurfaceY(10, rad(60), 'walls')).toBeNull()
  })

  it('is empty once the flaps hang vertically', () => {
    expect(flapSurfaceY(100, rad(89.9), 'walls')).toBeNull()
  })

  it('supports the center-hinge variant from the middle outwards', () => {
    expect(flapSurfaceY(5, rad(30), 'center')).toBeCloseTo(FLAP.topY - 5 * Math.tan(rad(30)), 6)
    expect(flapSurfaceY(FLAP.widthMm, rad(30), 'center')).toBeNull()
  })
})
