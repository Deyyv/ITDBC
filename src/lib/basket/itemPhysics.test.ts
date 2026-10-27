import { describe, expect, it } from 'vitest'
import { BIN, FLAP, FLAP_HOLE, ITEM_CLEARANCE_MM, ITEM_REST_Y_MM, SERVO_CONFIG } from './config'
import {
  GLIDE_RATE_PER_S,
  MAX_FRAME_S,
  PILE_HALF_X,
  PILE_HALF_Z,
  SLIDE_MM_S,
  advanceItem,
  clampFrameS,
  flapAngleRad,
  flapSurfaceY,
  glideFactor,
  glideHeight,
  glideToward,
  pileTarget,
  restOnFloor,
  slideOnFlap,
  spawnBody,
  spawnZRange,
  stepBody,
  stepOrSnap,
  type Body,
  type ItemFrame,
} from './itemPhysics'
import { mulberry32, nextSeed } from './rng'
import type { Vec3 } from './types'

const rad = (deg: number) => (deg * Math.PI) / 180

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

describe('frame timing', () => {
  it('caps the simulated step so a throttled tab cannot launch the items', () => {
    expect(clampFrameS(1 / 60)).toBe(1 / 60)
    expect(clampFrameS(2)).toBe(MAX_FRAME_S)
  })

  it('eases exponentially: nothing at dt = 0, never past the target', () => {
    expect(glideFactor(0)).toBe(0)
    expect(glideFactor(1 / 60)).toBeCloseTo(1 - Math.exp(-GLIDE_RATE_PER_S / 60), 12)
    expect(glideFactor(1 / 30)).toBeGreaterThan(glideFactor(1 / 60))
    expect(glideFactor(1)).toBeLessThan(1)
  })

  it('is independent of how a second is sliced', () => {
    const remaining = (steps: number) => (1 - glideFactor(1 / steps)) ** steps
    expect(remaining(30)).toBeCloseTo(remaining(120), 12)
  })
})

describe('flapAngleRad', () => {
  it('follows the servo linearly from closed to the full flap opening', () => {
    expect(flapAngleRad(0)).toBe(0)
    expect(flapAngleRad(SERVO_CONFIG.openDeg)).toBeCloseTo(rad(FLAP.openDeg), 12)
    expect(flapAngleRad(SERVO_CONFIG.openDeg / 2)).toBeCloseTo(rad(FLAP.openDeg) / 2, 12)
  })
})

describe('glideToward and glideHeight', () => {
  it('moves x and z a fraction of the way to the slot and leaves y alone', () => {
    const body = spawnBody(3)
    const { x: x0, y, z: z0 } = body
    const slot: Vec3 = [x0 + 40, 100, z0 - 20]
    glideToward(body, slot, 0.25)
    expect(body.x).toBeCloseTo(x0 + 10, 10)
    expect(body.z).toBeCloseTo(z0 - 5, 10)
    expect(body.y).toBe(y)
  })

  it('converges on the slot without overshooting', () => {
    const body = spawnBody(4)
    const slot: Vec3 = [50, 0, -60]
    const glide = glideFactor(1 / 60)
    let previous = Math.abs(body.x - slot[0])
    for (let step = 0; step < 600; step += 1) {
      glideToward(body, slot, glide)
      const distance = Math.abs(body.x - slot[0])
      expect(distance).toBeLessThanOrEqual(previous)
      previous = distance
    }
    expect(body.x).toBeCloseTo(50, 3)
    expect(body.z).toBeCloseTo(-60, 3)
  })

  it('eases the height towards a target', () => {
    const body = spawnBody(5)
    body.y = 100
    glideHeight(body, 40, 0.5)
    expect(body.y).toBe(70)
  })
})

describe('restOnFloor and stepOrSnap', () => {
  it('rests a flying body on the floor with no velocity or tilt left', () => {
    const body = spawnBody(8)
    body.vy = -900
    restOnFloor(body, 123)
    expect(body.y).toBe(123)
    expect([body.vx, body.vy, body.vz]).toEqual([0, 0, 0])
    expect([body.rx, body.rz]).toEqual([0, 0])
    expect(body.resting).toBe(true)
  })

  it('snaps straight to the floor when motion is reduced', () => {
    const body = spawnBody(8)
    stepOrSnap(body, 1 / 60, 180, true)
    expect(body.y).toBe(180)
    expect(body.resting).toBe(true)
    expect(body.bounces).toBe(0)
  })

  it('otherwise integrates like stepBody', () => {
    const stepped = spawnBody(8)
    const reference = spawnBody(8)
    for (let step = 0; step < 90; step += 1) {
      stepOrSnap(stepped, 1 / 60, 180, false)
      stepBody(reference, 1 / 60, 180)
    }
    expect(stepped).toEqual(reference)
  })
})

describe('slideOnFlap', () => {
  const bodyAt = (z: number): Body => ({ ...spawnBody(1), z })

  it('does not move on a flat flap', () => {
    const body = bodyAt(80)
    slideOnFlap(body, 0, 1 / 60, 'walls')
    expect(body.z).toBe(80)
  })

  it('slides towards the opening on both flaps when hinged at the walls', () => {
    const near = bodyAt(80)
    const far = bodyAt(-80)
    slideOnFlap(near, rad(40), 1 / 60, 'walls')
    slideOnFlap(far, rad(40), 1 / 60, 'walls')
    expect(near.z).toBeCloseTo(80 - (SLIDE_MM_S * Math.sin(rad(40))) / 60, 10)
    expect(far.z).toBeCloseTo(-near.z, 10)
  })

  it('slides faster the steeper the flap', () => {
    const gentle = bodyAt(80)
    const steep = bodyAt(80)
    slideOnFlap(gentle, rad(20), 1 / 60, 'walls')
    slideOnFlap(steep, rad(70), 1 / 60, 'walls')
    expect(steep.z).toBeLessThan(gentle.z)
  })

  it('never crosses the centre line', () => {
    const body = bodyAt(2)
    slideOnFlap(body, rad(85), 1, 'walls')
    expect(body.z).toBe(0)
  })

  it('slides away from the centre line when hinged at the centre', () => {
    const body = bodyAt(30)
    slideOnFlap(body, rad(40), 1 / 60, 'center')
    expect(body.z).toBeGreaterThan(30)
  })
})

describe('advanceItem', () => {
  const FRAME_S = 1 / 60
  const restMm = ITEM_REST_Y_MM.pet
  const flapFloor = FLAP.topY + restMm
  const binFloor = BIN.floorY + restMm
  const slot: Vec3 = [30, 60, -40]
  const frame = (overrides: Partial<ItemFrame>): ItemFrame => ({
    state: 'falling',
    slot: undefined,
    deltaS: FRAME_S,
    servoDeg: 0,
    restMm,
    reducedMotion: false,
    hinge: 'walls',
    ...overrides,
  })
  const run = (body: Body, seconds: number, overrides: Partial<ItemFrame>) => {
    for (let step = 0; step < seconds * 60; step += 1) advanceItem(body, frame(overrides))
  }
  const restingOnFlaps = (seed: number): Body => ({
    ...spawnBody(seed),
    y: flapFloor,
    resting: true,
  })

  it('drops onto the closed flaps and comes to rest there', () => {
    const body = spawnBody(11)
    run(body, 4, { state: 'falling' })
    expect(body.resting).toBe(true)
    expect(body.y).toBe(flapFloor)
  })

  it('keeps resting on the closed flaps while the item waits to be weighed', () => {
    const body = spawnBody(11)
    run(body, 4, { state: 'onFlaps' })
    run(body, 1, { state: 'onFlaps' })
    expect(body.y).toBe(flapFloor)
  })

  it('jumps onto the flaps at once when motion is reduced', () => {
    const body = spawnBody(11)
    advanceItem(body, frame({ state: 'falling', reducedMotion: true }))
    expect(body.y).toBe(flapFloor)
    expect(body.resting).toBe(true)
  })

  it('rides the opening flap towards the opening before it drops', () => {
    const body = { ...restingOnFlaps(11), z: 100 }
    run(body, 0.3, { state: 'dumping', servoDeg: 30, slot })
    expect(Math.abs(body.z)).toBeLessThan(100)
    expect(body.y).toBeLessThan(flapFloor)
  })

  it('falls into its pile slot once the flaps are open', () => {
    const body = restingOnFlaps(11)
    run(body, 6, { state: 'dumping', servoDeg: SERVO_CONFIG.openDeg, slot })
    expect(body.resting).toBe(true)
    expect(body.x).toBeCloseTo(slot[0], 2)
    expect(body.z).toBeCloseTo(slot[2], 2)
    expect(body.y).toBeCloseTo(Math.max(slot[1], binFloor), 6)
  })

  it('drops to the bin floor when it has no slot yet', () => {
    const body = restingOnFlaps(11)
    run(body, 6, { state: 'dumping', servoDeg: SERVO_CONFIG.openDeg, slot: undefined })
    expect(body.y).toBeCloseTo(binFloor, 6)
  })

  it('holds the flap floor while the flaps are still closed', () => {
    const body = { ...restingOnFlaps(11), z: 150 }
    run(body, 1, { state: 'dumping', servoDeg: 0, slot })
    expect(body.y).toBe(flapFloor)
  })

  it('skips the slide and lands in its slot at once when motion is reduced', () => {
    const body = { ...spawnBody(11), z: 100 }
    advanceItem(body, frame({ state: 'dumping', servoDeg: 30, slot, reducedMotion: true }))
    expect(body.resting).toBe(true)
    expect(body.y).toBeCloseTo(Math.max(slot[1], binFloor), 6)
    expect(body.z).toBeGreaterThan(slot[2])
    expect(body.z).toBeLessThan(100)
  })

  it('settles the pile: items glide into their slots', () => {
    const body = { ...restingOnFlaps(11), y: binFloor }
    run(body, 3, { state: 'settled', slot })
    expect(body.x).toBeCloseTo(slot[0], 2)
    expect(body.z).toBeCloseTo(slot[2], 2)
    expect(body.y).toBeCloseTo(Math.max(slot[1], binFloor), 2)
    expect(body.resting).toBe(true)
  })

  it('lets a settled item that is still airborne fall into its slot', () => {
    const body = spawnBody(11)
    run(body, 6, { state: 'settled', slot })
    expect(body.resting).toBe(true)
    expect(body.y).toBeCloseTo(Math.max(slot[1], binFloor), 6)
  })

  it('leaves a settled item without a slot where it is', () => {
    const body = spawnBody(11)
    const before = { ...body }
    advanceItem(body, frame({ state: 'settled', slot: undefined }))
    expect(body).toEqual(before)
  })

  it('does not integrate more than one capped step per frame', () => {
    const slow = spawnBody(11)
    const capped = spawnBody(11)
    advanceItem(slow, frame({ deltaS: 5 }))
    advanceItem(capped, frame({ deltaS: MAX_FRAME_S }))
    expect(slow).toEqual(capped)
  })
})
