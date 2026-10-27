import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { buildSimulatorCoupon, type SimulatorCoupon } from '../lib/coupon'
import { calculateDiscount, type DiscountResult } from '../lib/discount'
import { MATERIALS, TIMINGS } from '../lib/basket/config'
import { formatLcd } from '../lib/basket/lcd'
import {
  basketReducer,
  canDeposit as selectCanDeposit,
  canEmpty as selectCanEmpty,
  canGenerate as selectCanGenerate,
  canReset as selectCanReset,
  createBasketMachine,
  discountOf,
  fillPctOf,
  isBinFull,
  selectTelemetry,
  testLoadKg,
  toSimulatorPhase,
} from '../lib/basket/machine'
import { makeTickNoise } from '../lib/basket/noise'
import { mulberry32, nextSeed, type Rng } from '../lib/basket/rng'
import type {
  BasketTelemetry,
  DepositItem,
  LcdFrame,
  LogLine,
  MachineStateName,
  MaterialDef,
  MaterialId,
} from '../lib/basket/types'
import type { SimulatorPhase } from '../types/dashboard'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'

export type BasketTwin = {
  /** Live filtered weight on the flaps (kg). */
  weightKg: number
  /** Weight frozen when the reading stabilised; kept while the coupon is shown. */
  stableWeightKg: number
  /** Weight of the deposit in progress (what the slider should show). */
  targetKg: number
  phase: SimulatorPhase
  machineState: MachineStateName
  coupon: SimulatorCoupon | null
  discount: DiscountResult
  canGenerate: boolean
  canDeposit: boolean
  canEmpty: boolean
  /** False while the coupon / dump / close sequence runs and `reset` would be ignored. */
  canReset: boolean
  isFull: boolean
  /** True bin fill in percent (the telemetry value is the smoothed ToF reading). */
  binFillPct: number
  reducedMotion: boolean
  /** Manual mode: places a load directly on the flaps (treated as a mixed bag). */
  setWeight: (kg: number) => void
  /** Places a random test load. */
  simulateReading: () => void
  generateCoupon: () => SimulatorCoupon | null
  /** Cancels the deposit in progress, or clears the last coupon when idle. */
  reset: () => void
  deposit: (materialId: MaterialId) => void
  emptyBin: () => void
  materials: readonly MaterialDef[]
  telemetry: BasketTelemetry
  items: readonly DepositItem[]
  log: readonly LogLine[]
  lcd: LcdFrame
}

const roundKg = (kg: number) => Math.round(Math.max(0, kg) * 1000) / 1000

export function useBasketTwin(): BasketTwin {
  const reducedMotion = usePrefersReducedMotion()
  const [rng] = useState<Rng>(() => mulberry32(Date.now() >>> 0))
  const [machine, dispatch] = useReducer(basketReducer, undefined, () => createBasketMachine())

  const machineRef = useRef(machine)
  useEffect(() => {
    machineRef.current = machine
  }, [machine])

  const timeScale = reducedMotion ? TIMINGS.reducedMotionScale : 1

  // 10 Hz sensor tick: HX711 sample, presence, ToF, servo, ESP32 telemetry.
  useEffect(() => {
    let last = performance.now()
    const id = window.setInterval(() => {
      const now = performance.now()
      const dtMs = Math.min(now - last, TIMINGS.maxTickMs)
      last = now
      dispatch({ type: 'TICK', dtMs, noise: makeTickNoise(rng), timeScale })
    }, TIMINGS.sensorIntervalMs)
    return () => window.clearInterval(id)
  }, [rng, timeScale])

  const setWeight = useCallback(
    (kg: number) => dispatch({ type: 'SET_MANUAL_WEIGHT', kg, seed: nextSeed(rng) }),
    [rng],
  )

  const simulateReading = useCallback(() => {
    dispatch({ type: 'SET_MANUAL_WEIGHT', kg: testLoadKg(rng()), seed: nextSeed(rng) })
  }, [rng])

  const generateCoupon = useCallback(() => {
    const current = machineRef.current
    if (!selectCanGenerate(current)) return null
    const result = calculateDiscount(current.stableKg)
    const coupon = buildSimulatorCoupon(result.weightKg, result.pct)
    dispatch({ type: 'GENERATE', coupon })
    return coupon
  }, [])

  const reset = useCallback(() => dispatch({ type: 'CANCEL' }), [])

  const deposit = useCallback(
    (materialId: MaterialId) =>
      dispatch({ type: 'DEPOSIT', materialId, unit: rng(), seed: nextSeed(rng) }),
    [rng],
  )

  const emptyBin = useCallback(() => dispatch({ type: 'EMPTY_BIN' }), [])

  return useMemo<BasketTwin>(() => {
    const telemetry = selectTelemetry(machine)
    const discount = discountOf(machine)
    const weightKg = roundKg(machine.hxKg)
    return {
      weightKg,
      stableWeightKg: machine.stableKg,
      targetKg: machine.targetKg,
      phase: toSimulatorPhase(machine.state, machine.coupon !== null),
      machineState: machine.state,
      coupon: machine.coupon,
      discount,
      canGenerate: selectCanGenerate(machine),
      canDeposit: selectCanDeposit(machine),
      canEmpty: selectCanEmpty(machine),
      canReset: selectCanReset(machine),
      isFull: isBinFull(machine),
      binFillPct: Math.round(fillPctOf(machine) * 10) / 10,
      reducedMotion,
      setWeight,
      simulateReading,
      generateCoupon,
      reset,
      deposit,
      emptyBin,
      materials: MATERIALS,
      telemetry,
      items: machine.items,
      log: machine.log,
      lcd: formatLcd({
        state: machine.state,
        weightKg,
        discountPct: discount.pct,
        hasCoupon: machine.coupon !== null,
        rssiDbm: machine.rssiDbm,
      }),
    }
  }, [
    machine,
    reducedMotion,
    setWeight,
    simulateReading,
    generateCoupon,
    reset,
    deposit,
    emptyBin,
  ])
}
