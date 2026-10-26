import { describe, expect, it } from 'vitest'
import type { SimulatorCoupon } from '../coupon'
import { calculateDiscount } from '../discount'
import { LIMITS, MATERIAL_BY_ID, TEST_LOAD } from './config'
import { DEFAULT_CALIBRATION } from './hx711'
import {
  basketReducer,
  activeStepIndex,
  canDeposit,
  canEmpty,
  canGenerate,
  canReset,
  createBasketMachine,
  discountOf,
  fillPctOf,
  isBinFull,
  selectTelemetry,
  testLoadKg,
  toSimulatorPhase,
  type BasketAction,
  type BasketMachine,
} from './machine'
import { ZERO_NOISE, makeTickNoise } from './noise'
import { mulberry32 } from './rng'
import type { MachineStateName } from './types'

const TICK_MS = 100

const fakeCoupon = (pct: number, weightKg: number): SimulatorCoupon => ({
  code: 'RP-TEST42',
  pct,
  weightKg,
  weightLabel: `${weightKg} kg`,
  issuedAt: '2026-01-01T00:00:00.000Z',
  expiresAt: '2026-01-08T00:00:00.000Z',
  issuedLabel: '01 ene 2026',
  expiresLabel: '08 ene 2026',
  payload: 'test',
})

const send = (machine: BasketMachine, action: BasketAction) => basketReducer(machine, action)

const tick = (machine: BasketMachine, timeScale = 1, noise = ZERO_NOISE) =>
  send(machine, { type: 'TICK', dtMs: TICK_MS, noise, timeScale })

function runUntil(
  machine: BasketMachine,
  predicate: (machine: BasketMachine) => boolean,
  maxMs = 30_000,
  timeScale = 1,
): BasketMachine {
  let current = machine
  for (let elapsed = 0; elapsed < maxMs; elapsed += TICK_MS) {
    if (predicate(current)) return current
    current = tick(current, timeScale)
  }
  throw new Error(`Condition not reached; stuck in ${current.state}`)
}

const runFor = (machine: BasketMachine, ms: number) => {
  let current = machine
  for (let elapsed = 0; elapsed < ms; elapsed += TICK_MS) current = tick(current)
  return current
}

const inState =
  (...states: MachineStateName[]) =>
  (machine: BasketMachine) =>
    states.includes(machine.state)

const depositAction = (unit = 0.5, materialId: 'pet' | 'hdpe' | 'tapas' | 'mixta' = 'pet'): BasketAction => ({
  type: 'DEPOSIT',
  materialId,
  unit,
  seed: 4242,
})

/** Machine that has finished weighing a PET deposit. */
function calculatedMachine(unit = 0.5): BasketMachine {
  const started = send(createBasketMachine(), depositAction(unit))
  return runUntil(started, inState('calculated'))
}

/** Runs a whole deposit cycle until the basket is back to idle or full. */
function fullCycle(machine: BasketMachine, unit: number): BasketMachine {
  const calculated = runUntil(send(machine, depositAction(unit)), inState('calculated'))
  const discount = calculateDiscount(calculated.stableKg)
  const issued = send(calculated, {
    type: 'GENERATE',
    coupon: fakeCoupon(discount.pct, calculated.stableKg),
  })
  return runUntil(issued, inState('idle', 'full'))
}

describe('createBasketMachine', () => {
  it('boots idle, empty and ready to receive material', () => {
    const machine = createBasketMachine()
    expect(machine.state).toBe('idle')
    expect(canDeposit(machine)).toBe(true)
    expect(canEmpty(machine)).toBe(false)
    expect(machine.hxCal).toEqual(DEFAULT_CALIBRATION)
    expect(machine.log.map((line) => line.tag)).toEqual(['ESP32', 'HX711', 'SERVO', 'VL53L0X'])
  })
})

describe('deposit flow', () => {
  it('walks detecting -> dropping -> weighing -> calculated', () => {
    let machine = send(createBasketMachine(), depositAction(0.5))
    expect(machine.state).toBe('detecting')
    expect(machine.targetKg).toBeCloseTo(1.9, 6)

    const visited = new Set<MachineStateName>([machine.state])
    while (machine.state !== 'calculated') {
      machine = tick(machine)
      visited.add(machine.state)
      expect(machine.uptimeMs).toBeLessThan(30_000)
    }

    expect([...visited]).toEqual(['detecting', 'dropping', 'weighing', 'calculated'])
    expect(machine.stableKg).toBeCloseTo(1.9, 1)
    expect(discountOf(machine).pct).toBe(calculateDiscount(machine.stableKg).pct)
    expect(canGenerate(machine)).toBe(true)
  })

  it('keeps weighing at least 1.2 s and waits for the load cell to settle', () => {
    let machine = send(createBasketMachine(), depositAction(0.5))
    machine = runUntil(machine, inState('weighing'))
    let weighingMs = 0
    while (machine.state === 'weighing') {
      machine = tick(machine)
      weighingMs += TICK_MS
    }
    expect(weighingMs).toBeGreaterThanOrEqual(1200)
    expect(machine.stable).toBe(true)
  })

  it('reaches the same outcome with realistic seeded sensor noise', () => {
    const rng = mulberry32(2024)
    let machine = send(createBasketMachine(), depositAction(0.25, 'hdpe'))
    for (let step = 0; step < 300 && machine.state !== 'calculated'; step += 1) {
      machine = send(machine, { type: 'TICK', dtMs: TICK_MS, noise: makeTickNoise(rng) })
    }
    expect(machine.state).toBe('calculated')
    expect(machine.stableKg).toBeCloseTo(MATERIAL_BY_ID.hdpe.minKg + 0.25 * 1.1, 1)
  })

  it('creates falling items on drop and lets them rest on the flaps', () => {
    let machine = send(createBasketMachine(), depositAction(0.5))
    machine = runUntil(machine, inState('dropping'))
    expect(machine.items.length).toBeGreaterThanOrEqual(MATERIAL_BY_ID.pet.minItems)
    expect(machine.items.every((item) => item.state === 'falling')).toBe(true)
    machine = runUntil(machine, inState('weighing'))
    expect(machine.items.every((item) => item.state === 'onFlaps')).toBe(true)
  })
})

describe('guards', () => {
  it('ignores a deposit while the basket is busy', () => {
    const busy = send(createBasketMachine(), depositAction())
    expect(send(busy, depositAction())).toBe(busy)
    const weighing = runUntil(busy, inState('weighing'))
    expect(send(weighing, depositAction())).toBe(weighing)
  })

  it('only issues a coupon from calculated with a positive discount', () => {
    const coupon = fakeCoupon(11, 1.9)
    const idle = createBasketMachine()
    expect(send(idle, { type: 'GENERATE', coupon })).toBe(idle)

    const weighing = runUntil(send(idle, depositAction()), inState('weighing'))
    expect(send(weighing, { type: 'GENERATE', coupon })).toBe(weighing)

    const calculated = calculatedMachine()
    const matching = fakeCoupon(
      calculateDiscount(calculated.stableKg).pct,
      calculated.stableKg,
    )
    const issued = send(calculated, { type: 'GENERATE', coupon: matching })
    expect(issued.state).toBe('qr')
    expect(issued.coupon).toBe(matching)
    expect(canGenerate(issued)).toBe(false)

    expect(send(calculated, { type: 'GENERATE', coupon: fakeCoupon(30, 5) })).toBe(calculated)
  })

  it('does not issue a coupon when the weight is too small for 1 percent', () => {
    let machine = send(createBasketMachine(), { type: 'SET_MANUAL_WEIGHT', kg: 0.1, seed: 9 })
    machine = runUntil(machine, inState('calculated'))
    expect(discountOf(machine).pct).toBe(0)
    expect(canGenerate(machine)).toBe(false)
    const attempt = send(machine, { type: 'GENERATE', coupon: fakeCoupon(1, 0.1) })
    expect(attempt).toBe(machine)
    expect(attempt.coupon).toBeNull()
  })

  it('does not issue a coupon under overload', () => {
    const overloaded: BasketMachine = { ...calculatedMachine(), overload: true }
    expect(canGenerate(overloaded)).toBe(false)
  })
})

describe('dump cycle', () => {
  it('opens, releases the material, closes, tares and keeps the coupon', () => {
    const calculated = calculatedMachine(0.5)
    const coupon = fakeCoupon(calculateDiscount(calculated.stableKg).pct, calculated.stableKg)
    let machine = send(calculated, { type: 'GENERATE', coupon })

    const visited = new Set<MachineStateName>([machine.state])
    let peakServo = 0
    while (machine.state !== 'idle') {
      machine = tick(machine)
      visited.add(machine.state)
      peakServo = Math.max(peakServo, selectTelemetry(machine).servoDeg)
      expect(machine.uptimeMs).toBeLessThan(60_000)
    }

    expect([...visited]).toEqual(['qr', 'dumping', 'closing', 'idle'])
    expect(peakServo).toBe(85)
    expect(selectTelemetry(machine).servoDeg).toBe(0)
    expect(machine.coupon).toBe(coupon)
    expect(machine.stableKg).toBe(calculated.stableKg)
    expect(machine.loadKg).toBe(0)
    expect(machine.hxKg).toBe(0)
    expect(machine.hxCal.offset).not.toBe(DEFAULT_CALIBRATION.offset)
    expect(fillPctOf(machine)).toBeGreaterThan(0)
    expect(machine.items.every((item) => item.state === 'settled')).toBe(true)
    expect(toSimulatorPhase(machine.state, machine.coupon !== null)).toBe('qr')
  })

  it('raises the fill level seen by the ToF sensor', () => {
    const before = createBasketMachine()
    const after = fullCycle(before, 0.5)
    const settled = runFor(after, 2000)
    expect(selectTelemetry(settled).fillPct).toBeGreaterThan(20)
    expect(settled.tofMm).toBeLessThan(before.tofMm - 20)
  })

  it('runs faster when the reduced-motion time scale is applied', () => {
    const calculated = calculatedMachine(0.5)
    const coupon = fakeCoupon(calculateDiscount(calculated.stableKg).pct, calculated.stableKg)
    const issued = send(calculated, { type: 'GENERATE', coupon })

    const countTicks = (timeScale: number) => {
      let machine = issued
      let ticks = 0
      while (machine.state !== 'idle') {
        machine = tick(machine, timeScale)
        ticks += 1
      }
      return ticks
    }
    expect(countTicks(2)).toBeLessThan(countTicks(1) * 0.7)
  })
})

describe('full lock', () => {
  it('blocks deposits once the bin reaches 90 percent until it is emptied', () => {
    let machine = fullCycle(createBasketMachine(), 1)
    expect(machine.state).toBe('idle')
    expect(isBinFull(machine)).toBe(false)

    machine = fullCycle(machine, 1)
    expect(machine.state).toBe('full')
    expect(isBinFull(machine)).toBe(true)
    expect(canDeposit(machine)).toBe(false)
    expect(send(machine, depositAction())).toBe(machine)
    expect(send(machine, { type: 'SET_MANUAL_WEIGHT', kg: 2, seed: 1 })).toBe(machine)
    expect(toSimulatorPhase(machine.state, true)).toBe('qr')
    expect(toSimulatorPhase(machine.state, false)).toBe('idle')
    expect(selectTelemetry(machine).fillPct).toBeGreaterThan(80)

    expect(canEmpty(machine)).toBe(true)
    const emptied = send(machine, { type: 'EMPTY_BIN' })
    expect(emptied.state).toBe('idle')
    expect(emptied.fillL).toBe(0)
    expect(emptied.items.filter((item) => item.state === 'settled')).toHaveLength(0)
    expect(canDeposit(emptied)).toBe(true)
  })

  it('refuses to empty an empty bin or a busy machine', () => {
    const idle = createBasketMachine()
    expect(send(idle, { type: 'EMPTY_BIN' })).toBe(idle)
    const busy = send(idle, depositAction())
    expect(send(busy, { type: 'EMPTY_BIN' })).toBe(busy)
  })
})

describe('manual mode', () => {
  it('treats the slider as a mixed-bag deposit', () => {
    let machine = send(createBasketMachine(), { type: 'SET_MANUAL_WEIGHT', kg: 2.5, seed: 7 })
    expect(machine.state).toBe('dropping')
    expect(machine.manual).toBe(true)
    expect(machine.materialId).toBe('mixta')
    expect(machine.items.every((item) => item.materialId === 'mixta')).toBe(true)

    machine = runUntil(machine, inState('calculated'))
    expect(machine.stableKg).toBeCloseTo(2.5, 1)
    expect(discountOf(machine).pct).toBe(calculateDiscount(machine.stableKg).pct)
  })

  it('goes back to weighing when the slider moves and cancels at zero', () => {
    let machine = send(createBasketMachine(), { type: 'SET_MANUAL_WEIGHT', kg: 1, seed: 7 })
    machine = runUntil(machine, inState('calculated'))

    machine = send(machine, { type: 'SET_MANUAL_WEIGHT', kg: 3, seed: 7 })
    expect(machine.state).toBe('weighing')
    expect(machine.stableKg).toBe(0)
    machine = runUntil(machine, inState('calculated'))
    expect(machine.stableKg).toBeCloseTo(3, 1)

    machine = send(machine, { type: 'SET_MANUAL_WEIGHT', kg: 0, seed: 7 })
    expect(machine.state).toBe('idle')
    expect(machine.items).toHaveLength(0)
    expect(machine.targetKg).toBe(0)
  })

  it('ignores the slider while the basket is dumping', () => {
    const calculated = calculatedMachine()
    const issued = send(calculated, {
      type: 'GENERATE',
      coupon: fakeCoupon(calculateDiscount(calculated.stableKg).pct, calculated.stableKg),
    })
    expect(send(issued, { type: 'SET_MANUAL_WEIGHT', kg: 1, seed: 1 })).toBe(issued)
  })
})

describe('cancel', () => {
  it('clears an in-progress deposit', () => {
    const weighing = runUntil(send(createBasketMachine(), depositAction()), inState('weighing'))
    const cancelled = send(weighing, { type: 'CANCEL' })
    expect(cancelled.state).toBe('idle')
    expect(cancelled.items).toHaveLength(0)
    expect(cancelled.loadKg).toBe(0)
  })

  it('is ignored during the coupon and dump sequence', () => {
    const calculated = calculatedMachine()
    const issued = send(calculated, {
      type: 'GENERATE',
      coupon: fakeCoupon(calculateDiscount(calculated.stableKg).pct, calculated.stableKg),
    })
    expect(send(issued, { type: 'CANCEL' })).toBe(issued)
  })

  it('discards the last coupon once the basket is idle again', () => {
    const idle = fullCycle(createBasketMachine(), 0.5)
    expect(idle.coupon).not.toBeNull()
    const cleared = send(idle, { type: 'CANCEL' })
    expect(cleared.coupon).toBeNull()
    expect(cleared.stableKg).toBe(0)
    expect(send(cleared, { type: 'CANCEL' })).toBe(cleared)
  })

  it('clears the previous coupon when a new deposit starts', () => {
    const idle = fullCycle(createBasketMachine(), 0.5)
    expect(idle.coupon).not.toBeNull()
    expect(send(idle, depositAction(0.2, 'tapas')).coupon).toBeNull()
  })
})

describe('canReset', () => {
  it('matches what CANCEL actually does through the whole coupon cycle', () => {
    expect(canReset(createBasketMachine())).toBe(false)

    const weighing = runUntil(send(createBasketMachine(), depositAction()), inState('weighing'))
    expect(canReset(weighing)).toBe(true)

    const calculated = calculatedMachine()
    expect(canReset(calculated)).toBe(true)

    const issued = send(calculated, {
      type: 'GENERATE',
      coupon: fakeCoupon(calculateDiscount(calculated.stableKg).pct, calculated.stableKg),
    })
    // The 5 s sequence ignores the button, so the UI must show it disabled.
    for (const state of ['qr', 'dumping', 'closing'] as const) {
      const machine = state === 'qr' ? issued : runUntil(issued, inState(state))
      expect(canReset(machine)).toBe(false)
      expect(send(machine, { type: 'CANCEL' })).toBe(machine)
    }

    const idle = runUntil(issued, inState('idle', 'full'))
    expect(canReset(idle)).toBe(true)
    expect(canReset(send(idle, { type: 'CANCEL' }))).toBe(false)
  })
})

describe('telemetry and phases', () => {
  it('maps machine states to dashboard phases', () => {
    expect(toSimulatorPhase('idle', false)).toBe('idle')
    expect(toSimulatorPhase('idle', true)).toBe('qr')
    expect(toSimulatorPhase('detecting', false)).toBe('weighing')
    expect(toSimulatorPhase('dropping', false)).toBe('weighing')
    expect(toSimulatorPhase('weighing', false)).toBe('weighing')
    expect(toSimulatorPhase('calculated', false)).toBe('calculated')
    expect(toSimulatorPhase('qr', true)).toBe('qr')
    expect(toSimulatorPhase('dumping', true)).toBe('qr')
    expect(toSimulatorPhase('closing', true)).toBe('qr')
  })

  it('exposes the active stepper index', () => {
    expect(activeStepIndex('idle')).toBe(-1)
    expect(activeStepIndex('detecting')).toBe(0)
    expect(activeStepIndex('weighing')).toBe(2)
    expect(activeStepIndex('qr')).toBe(4)
    expect(activeStepIndex('closing')).toBe(5)
  })

  it('caps the serial log and the history buffer', () => {
    let machine = createBasketMachine()
    machine = runFor(machine, 15_000)
    for (let cycle = 0; cycle < 20; cycle += 1) {
      machine = send(machine, { type: 'SET_MANUAL_WEIGHT', kg: 1 + (cycle % 10) * 0.1, seed: cycle })
      machine = runFor(machine, 4000)
      machine = send(machine, { type: 'CANCEL' })
    }
    expect(machine.log).toHaveLength(LIMITS.maxLogLines)
    expect(machine.history.length).toBeLessThanOrEqual(LIMITS.maxHistory)
    const ids = machine.log.map((line) => line.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('reports servo pulse width alongside the angle', () => {
    const telemetry = selectTelemetry(createBasketMachine())
    expect(telemetry.servoDeg).toBe(0)
    expect(telemetry.servoUs).toBe(500)
    expect(telemetry.overload).toBe(false)
  })

  it('flags overload when the load exceeds the rating', () => {
    const heavy: BasketMachine = { ...createBasketMachine(), state: 'weighing', loadKg: 6, stepKg: 0 }
    let machine = heavy
    for (let step = 0; step < 15; step += 1) machine = tick(machine)
    expect(machine.overload).toBe(true)
    expect(machine.log.some((line) => line.message.includes('SOBRECARGA'))).toBe(true)
  })
})

describe('testLoadKg', () => {
  it('maps the unit draw onto the configured test-load range', () => {
    expect(testLoadKg(0)).toBe(TEST_LOAD.minKg)
    expect(testLoadKg(1)).toBe(TEST_LOAD.maxKg)
  })

  it('clamps draws outside [0, 1]', () => {
    expect(testLoadKg(-3)).toBe(TEST_LOAD.minKg)
    expect(testLoadKg(7)).toBe(TEST_LOAD.maxKg)
  })

  it('rounds to two decimals and stays within the load cell range', () => {
    const rng = mulberry32(17)
    for (let i = 0; i < 200; i += 1) {
      const kg = testLoadKg(rng())
      expect(Math.round(kg * 100) / 100).toBe(kg)
      expect(kg).toBeGreaterThanOrEqual(TEST_LOAD.minKg)
      expect(kg).toBeLessThanOrEqual(TEST_LOAD.maxKg)
    }
  })
})
