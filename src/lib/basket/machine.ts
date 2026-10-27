/**
 * Pure state machine of the smart basket.
 *
 * idle -> detecting -> dropping -> weighing -> calculated -> (GENERATE) qr -> dumping -> closing
 * -> idle | full. All randomness comes in through the actions (z-score noise, unit draws, seeds),
 * so the reducer is deterministic and the timers live in the `useBasketTwin` hook.
 */
import type { SimulatorCoupon } from '../coupon'
import { calculateDiscount, clampWeight, type DiscountResult } from '../discount'
import type { SimulatorPhase } from '../../types/dashboard'
import {
  BIN,
  HX711_CONFIG,
  IMPACT,
  LIMITS,
  LOAD_CELL,
  MATERIAL_BY_ID,
  PRESENCE_SENSOR,
  SERVO_CONFIG,
  TEST_LOAD,
  TIMINGS,
  TOF_SENSOR,
  WIFI,
} from './config'
import { addVolumeL, depositVolumeL, fillPct, isFull, tofDistanceMm } from './fillLevel'
import {
  DEFAULT_CALIBRATION,
  applyDeadband,
  filteredKg,
  isOverload,
  isStable,
  kgToRaw,
  pushSample,
  rawToKg,
  sigmaKg,
  tare,
  type Hx711Calibration,
} from './hx711'
import type { TickNoise } from './noise'
import {
  advanceServo,
  angleToPulseUs,
  commandServo,
  createServo,
  isServoSettled,
  servoAngle,
  type ServoMotion,
} from './servo'
import type {
  BasketTelemetry,
  DepositItem,
  LogLine,
  LogTag,
  MachineStateName,
  MaterialId,
} from './types'

/* ------------------------------------------------------------------ */
/* State                                                               */
/* ------------------------------------------------------------------ */

export type BasketMachine = {
  readonly state: MachineStateName
  /** Machine time spent in the current state (ms, scaled by the reduced-motion factor). */
  readonly stateMs: number
  /** Firmware uptime in real milliseconds. */
  readonly uptimeMs: number

  /* Deposit in progress */
  readonly materialId: MaterialId | null
  readonly manual: boolean
  readonly seed: number
  /** Weight of the deposit the user is making (kg). */
  readonly targetKg: number
  /** True weight resting on the flaps (kg). */
  readonly loadKg: number
  /** Size of the last load step; drives the impact transient on the load cell. */
  readonly stepKg: number
  readonly impactMs: number
  /** Weight frozen when the reading stabilised; survives until the next deposit. */
  readonly stableKg: number
  readonly dumpApplied: boolean

  /* HX711 */
  readonly hxCal: Hx711Calibration
  readonly driftCounts: number
  readonly rawWindow: readonly number[]
  readonly hxRaw: number
  readonly hxKg: number
  readonly sigmaKg: number
  readonly stable: boolean
  readonly overload: boolean
  readonly history: readonly number[]

  /* Other sensors */
  readonly servo: ServoMotion
  readonly fillL: number
  /** Fill level as seen by the ToF sensor (follows `fillL` smoothly). */
  readonly fillShownL: number
  readonly presenceCm: number
  readonly tofMm: number
  readonly rssiDbm: number

  /* Outputs */
  readonly items: readonly DepositItem[]
  readonly coupon: SimulatorCoupon | null
  readonly log: readonly LogLine[]
  readonly nextId: number
}

export type BasketAction =
  | { type: 'TICK'; dtMs: number; noise: TickNoise; timeScale?: number }
  | { type: 'DEPOSIT'; materialId: MaterialId; unit: number; seed: number }
  | { type: 'SET_MANUAL_WEIGHT'; kg: number; seed: number }
  | { type: 'GENERATE'; coupon: SimulatorCoupon }
  | { type: 'CANCEL' }
  | { type: 'EMPTY_BIN' }

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const clamp01 = (value: number) => clamp(value, 0, 1)
const lerp = (from: number, to: number, t: number) => from + (to - from) * t
const round = (value: number, digits: number) => {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}
const kgText = (kg: number) => `${kg.toFixed(2)} kg`

const BUSY_STATES: readonly MachineStateName[] = ['qr', 'dumping', 'closing']
const CANCELLABLE_STATES: readonly MachineStateName[] = [
  'detecting',
  'dropping',
  'weighing',
  'calculated',
]

function log(machine: BasketMachine, tag: LogTag, message: string): BasketMachine {
  const line: LogLine = {
    id: machine.nextId,
    t: Math.round(machine.uptimeMs),
    tag,
    message,
  }
  const lines = [...machine.log, line]
  return {
    ...machine,
    nextId: machine.nextId + 1,
    log: lines.length > LIMITS.maxLogLines ? lines.slice(lines.length - LIMITS.maxLogLines) : lines,
  }
}

function enter(
  machine: BasketMachine,
  state: MachineStateName,
  patch: Partial<BasketMachine> = {},
): BasketMachine {
  return { ...machine, ...patch, state, stateMs: 0 }
}

/** Keeps the render budget: oldest settled items are dropped first. */
function capItems(items: readonly DepositItem[]): readonly DepositItem[] {
  let excess = items.length - LIMITS.maxItems
  if (excess <= 0) return items
  return items.filter((item) => {
    if (excess > 0 && item.state === 'settled') {
      excess -= 1
      return false
    }
    return true
  })
}

function setItemStates(
  items: readonly DepositItem[],
  from: DepositItem['state'],
  to: DepositItem['state'],
): readonly DepositItem[] {
  return items.map((item) => (item.state === from ? { ...item, state: to } : item))
}

/* ------------------------------------------------------------------ */
/* Selectors                                                           */
/* ------------------------------------------------------------------ */

export function fillPctOf(machine: BasketMachine): number {
  return fillPct(machine.fillL)
}

export function isBinFull(machine: BasketMachine): boolean {
  return isFull(fillPctOf(machine))
}

export function canDeposit(machine: BasketMachine): boolean {
  return machine.state === 'idle' && !isBinFull(machine)
}

export function canEmpty(machine: BasketMachine): boolean {
  return (machine.state === 'idle' || machine.state === 'full') && machine.fillL > 0
}

/**
 * Whether a CANCEL does something: it cancels a deposit in progress or discards the last coupon,
 * but is ignored while the coupon / dump / close sequence runs.
 */
export function canReset(machine: BasketMachine): boolean {
  if (CANCELLABLE_STATES.includes(machine.state)) return true
  if (BUSY_STATES.includes(machine.state)) return false
  return machine.coupon !== null || machine.stableKg !== 0
}

export function isBusy(machine: BasketMachine): boolean {
  return machine.state !== 'idle' && machine.state !== 'full'
}

/** Discount for the weight on the scale (live while weighing, frozen afterwards). */
export function discountOf(machine: BasketMachine): DiscountResult {
  const live =
    machine.state === 'detecting' || machine.state === 'dropping' || machine.state === 'weighing'
  return calculateDiscount(live ? Math.max(0, machine.hxKg) : machine.stableKg)
}

export function canGenerate(machine: BasketMachine): boolean {
  return (
    machine.state === 'calculated' &&
    !machine.overload &&
    calculateDiscount(machine.stableKg).pct > 0
  )
}

/** Weight (kg, two decimals) of the random test load for a unit draw in [0, 1]. */
export function testLoadKg(unit: number): number {
  return round(lerp(TEST_LOAD.minKg, TEST_LOAD.maxKg, clamp01(unit)), 2)
}

/** Maps the detailed machine state to the coarse phase the dashboard widgets understand. */
export function toSimulatorPhase(state: MachineStateName, hasCoupon: boolean): SimulatorPhase {
  switch (state) {
    case 'detecting':
    case 'dropping':
    case 'weighing':
      return 'weighing'
    case 'calculated':
      return 'calculated'
    case 'qr':
    case 'dumping':
    case 'closing':
      return 'qr'
    case 'idle':
    case 'full':
      return hasCoupon ? 'qr' : 'idle'
  }
}

/** Index of the active step in PHASE_STEPS, or -1 while the basket waits. */
export function activeStepIndex(state: MachineStateName): number {
  switch (state) {
    case 'detecting':
      return 0
    case 'dropping':
      return 1
    case 'weighing':
      return 2
    case 'calculated':
      return 3
    case 'qr':
      return 4
    case 'dumping':
    case 'closing':
      return 5
    case 'idle':
    case 'full':
      return -1
  }
}

export function selectTelemetry(machine: BasketMachine): BasketTelemetry {
  const servoDeg = round(servoAngle(machine.servo), 1)
  return {
    hx711Raw: machine.hxRaw,
    hx711Kg: machine.hxKg,
    stable: machine.stable,
    sigmaG: round(machine.sigmaKg * 1000, 1),
    history: machine.history,
    presenceCm: round(machine.presenceCm, 1),
    fillPct: round(fillPct(machine.fillShownL), 1),
    tofMm: Math.round(machine.tofMm),
    servoDeg,
    servoUs: angleToPulseUs(servoDeg),
    rssiDbm: machine.rssiDbm,
    uptimeS: Math.floor(machine.uptimeMs / 1000),
    overload: machine.overload,
  }
}

/* ------------------------------------------------------------------ */
/* Creation                                                            */
/* ------------------------------------------------------------------ */

export type CreateMachineOptions = {
  /** Firmware uptime at creation (ms). */
  uptimeMs?: number
}

export function createBasketMachine({ uptimeMs = 4200 }: CreateMachineOptions = {}): BasketMachine {
  const base: BasketMachine = {
    state: 'idle',
    stateMs: 0,
    uptimeMs,
    materialId: null,
    manual: false,
    seed: 1,
    targetKg: 0,
    loadKg: 0,
    stepKg: 0,
    impactMs: 0,
    stableKg: 0,
    dumpApplied: false,
    hxCal: DEFAULT_CALIBRATION,
    driftCounts: 0,
    rawWindow: [],
    hxRaw: DEFAULT_CALIBRATION.offset,
    hxKg: 0,
    sigmaKg: 0,
    stable: false,
    overload: false,
    history: [],
    servo: createServo(SERVO_CONFIG.closedDeg),
    fillL: 0,
    fillShownL: 0,
    presenceCm: PRESENCE_SENSOR.restCm,
    tofMm: tofDistanceMm(0),
    rssiDbm: WIFI.baseDbm,
    items: [],
    coupon: null,
    log: [],
    nextId: 1,
  }

  let machine = log(base, 'ESP32', `Arranque correcto · Wi-Fi conectado (${WIFI.baseDbm} dBm)`)
  machine = log(machine, 'HX711', `Tara inicial completada · offset ${base.hxCal.offset}`)
  machine = log(machine, 'SERVO', `Compuertas cerradas (0°, ${angleToPulseUs(0)} µs)`)
  machine = log(machine, 'VL53L0X', `Cesta vacía · ${Math.round(base.tofMm)} mm hasta el fondo`)
  return machine
}

/* ------------------------------------------------------------------ */
/* Tick                                                                */
/* ------------------------------------------------------------------ */

/** Load that the load cell actually feels, including the landing transient. */
function effectiveLoadKg(
  state: MachineStateName,
  loadKg: number,
  stepKg: number,
  impactMs: number,
  openFraction: number,
): number {
  let kg = loadKg
  if (state === 'weighing' || state === 'calculated' || state === 'qr') {
    const t = impactMs / 1000
    kg += stepKg * IMPACT.amplitude * Math.exp(-t / IMPACT.tauS) * Math.cos(2 * Math.PI * IMPACT.hz * t)
  }
  if (state === 'dumping') kg *= 1 - openFraction
  return Math.max(0, kg)
}

function presenceBase(state: MachineStateName, stateMs: number, openFraction: number): number {
  const { restCm, nearCm, loadedCm, openCm } = PRESENCE_SENSOR
  switch (state) {
    case 'detecting':
      return lerp(restCm, nearCm, clamp01(stateMs / TIMINGS.detectMs))
    case 'dropping':
      return lerp(nearCm, loadedCm, clamp01(stateMs / TIMINGS.dropMs))
    case 'weighing':
    case 'calculated':
    case 'qr':
      return loadedCm
    case 'dumping':
      return lerp(loadedCm, openCm, openFraction)
    case 'closing':
      return lerp(restCm, openCm, openFraction)
    case 'idle':
    case 'full':
      return restCm
  }
}

function startDropping(machine: BasketMachine): BasketMachine {
  const material = MATERIAL_BY_ID[machine.materialId ?? 'mixta']
  const count = clamp(
    Math.round(machine.targetKg * material.itemsPerKg),
    material.minItems,
    material.maxItems,
  )
  const created: DepositItem[] = Array.from({ length: count }, (_, index) => ({
    id: machine.nextId + index,
    materialId: material.id,
    seed: (machine.seed * 31 + index * 7919) >>> 0,
    state: 'falling',
  }))

  const next = enter(machine, 'dropping', {
    items: capItems([...machine.items, ...created]),
    nextId: machine.nextId + count,
  })
  return log(
    next,
    'PRESENCE',
    `Objeto detectado a ${machine.presenceCm.toFixed(1)} cm · ${material.label} (${count} piezas)`,
  )
}

function finishClosing(machine: BasketMachine): BasketMachine {
  const calibration = tare(machine.rawWindow, machine.hxCal)
  const full = isFull(fillPct(machine.fillL))
  let next = enter(machine, full ? 'full' : 'idle', {
    hxCal: calibration,
    materialId: null,
    manual: false,
    targetKg: 0,
    loadKg: 0,
    stepKg: 0,
    impactMs: 0,
  })
  next = log(next, 'HX711', `Tara completada · offset ${calibration.offset}`)
  next = log(
    next,
    'VL53L0X',
    `Nivel ${Math.round(fillPct(machine.fillL))} % · ${Math.round(tofDistanceMm(fillPct(machine.fillL)))} mm hasta el material`,
  )
  if (full) {
    next = log(next, 'ESP32', 'Cesta llena (≥ 90 %) · depósitos bloqueados hasta vaciarla')
  }
  return next
}

function tick(machine: BasketMachine, action: Extract<BasketAction, { type: 'TICK' }>): BasketMachine {
  const dtMs = Math.max(0, action.dtMs)
  const scaledMs = dtMs * (action.timeScale ?? 1)
  const { noise } = action

  const servo = advanceServo(machine.servo, scaledMs)
  const servoDeg = servoAngle(servo)
  const openFraction = clamp01(servoDeg / SERVO_CONFIG.openDeg)

  const uptimeMs = machine.uptimeMs + dtMs
  const stateMs = machine.stateMs + scaledMs
  const impactMs = machine.impactMs + scaledMs
  const driftCounts = machine.driftCounts + (HX711_CONFIG.driftCountsPerS * dtMs) / 1000

  // HX711 sample: true load -> raw counts -> filtered kilograms.
  const trueKg = effectiveLoadKg(
    machine.state,
    machine.loadKg,
    machine.stepKg,
    impactMs,
    openFraction,
  )
  const raw = kgToRaw(
    trueKg,
    { ...machine.hxCal, offset: machine.hxCal.offset + driftCounts },
    noise.hx711 * HX711_CONFIG.noiseCounts,
  )
  const rawWindow = pushSample(machine.rawWindow, raw)
  const kgWindow = rawWindow.map((sample) => rawToKg(sample, machine.hxCal))
  const filtered = filteredKg(kgWindow)
  const hxKg = applyDeadband(filtered)
  const overload = isOverload(filtered, LOAD_CELL.maxKg + HX711_CONFIG.overloadMarginKg)

  // Remaining sensors.
  const fillStep = (TIMINGS.fillAnimLitersPerS * dtMs) / 1000
  const fillShownL =
    machine.fillShownL < machine.fillL
      ? Math.min(machine.fillL, machine.fillShownL + fillStep)
      : Math.max(machine.fillL, machine.fillShownL - fillStep)

  const presenceCm = Math.max(
    2,
    presenceBase(machine.state, stateMs, openFraction) + noise.presence * PRESENCE_SENSOR.noiseCm,
  )
  const tofMm = clamp(
    tofDistanceMm(fillPct(fillShownL)) + noise.tof * TOF_SENSOR.noiseMm,
    TOF_SENSOR.minMm,
    TOF_SENSOR.maxMm,
  )
  const rssiDbm = Math.round(
    WIFI.baseDbm + WIFI.swingDb * Math.sin(uptimeMs / 7000) + noise.rssi * WIFI.noiseDb,
  )

  let next: BasketMachine = {
    ...machine,
    uptimeMs,
    stateMs,
    impactMs,
    servo,
    driftCounts,
    rawWindow,
    hxRaw: raw,
    hxKg,
    sigmaKg: sigmaKg(kgWindow),
    stable: isStable(kgWindow),
    overload,
    history: pushSample(machine.history, round(hxKg, 4), LIMITS.maxHistory),
    fillShownL,
    presenceCm,
    tofMm,
    rssiDbm,
  }

  if (overload && !machine.overload) {
    next = log(next, 'HX711', `SOBRECARGA: ${kgText(filtered)} supera el límite de ${LOAD_CELL.maxKg} kg`)
  }
  if (Math.floor(uptimeMs / 10_000) > Math.floor(machine.uptimeMs / 10_000)) {
    next = log(next, 'ESP32', `Latido · RSSI ${rssiDbm} dBm · uptime ${Math.floor(uptimeMs / 1000)} s`)
  }

  switch (next.state) {
    case 'detecting':
      return stateMs >= TIMINGS.detectMs ? startDropping(next) : next

    case 'dropping': {
      if (stateMs < TIMINGS.dropMs) return next
      const landed = enter(next, 'weighing', {
        items: setItemStates(next.items, 'falling', 'onFlaps'),
        loadKg: next.targetKg,
        stepKg: next.targetKg,
        impactMs: 0,
        stableKg: 0,
      })
      return log(landed, 'HX711', `Carga detectada · estabilizando lectura (objetivo ${kgText(next.targetKg)})`)
    }

    case 'weighing': {
      if (!next.stable || stateMs < TIMINGS.minWeighMs || next.hxKg <= 0) return next
      const stableKg = round(next.hxKg, 2)
      const discount = calculateDiscount(stableKg)
      const settled = enter(next, 'calculated', { stableKg })
      return log(
        settled,
        'HX711',
        `Peso estable ${kgText(stableKg)} (σ ${round(next.sigmaKg * 1000, 1)} g) · descuento ${discount.pct} %`,
      )
    }

    case 'calculated': {
      if (next.stable && Math.abs(next.hxKg - next.stableKg) <= 0.05) return next
      const unsettled = enter(next, 'weighing', { stableKg: 0 })
      return log(unsettled, 'HX711', 'Lectura inestable · vuelve a pesar')
    }

    case 'qr': {
      if (stateMs < TIMINGS.qrHoldMs) return next
      const opening = enter(next, 'dumping', {
        servo: commandServo(next.servo, SERVO_CONFIG.openDeg),
        items: setItemStates(next.items, 'onFlaps', 'dumping'),
        dumpApplied: false,
      })
      return log(
        opening,
        'SERVO',
        `Abriendo compuertas → ${SERVO_CONFIG.openDeg}° (${angleToPulseUs(SERVO_CONFIG.openDeg)} µs)`,
      )
    }

    case 'dumping': {
      let current = next
      if (!current.dumpApplied && openFraction >= 0.5) {
        const material = MATERIAL_BY_ID[current.materialId ?? 'mixta']
        const volume = depositVolumeL(current.stableKg, material.litersPerKg)
        current = log(
          { ...current, dumpApplied: true, fillL: addVolumeL(current.fillL, volume) },
          'SERVO',
          `Material liberado · +${volume.toFixed(1)} L en la cesta inferior`,
        )
      }
      if (isServoSettled(current.servo) && stateMs >= current.servo.durationMs + TIMINGS.openHoldMs) {
        const closing = enter(current, 'closing', {
          servo: commandServo(current.servo, SERVO_CONFIG.closedDeg),
          items: setItemStates(current.items, 'dumping', 'settled'),
          loadKg: 0,
          stepKg: 0,
        })
        return log(closing, 'SERVO', `Cerrando compuertas → 0° (${angleToPulseUs(0)} µs)`)
      }
      return current
    }

    case 'closing':
      return isServoSettled(next.servo) ? finishClosing(next) : next

    case 'idle':
    case 'full':
      return next
  }
}

/* ------------------------------------------------------------------ */
/* Commands                                                            */
/* ------------------------------------------------------------------ */

function deposit(
  machine: BasketMachine,
  action: Extract<BasketAction, { type: 'DEPOSIT' }>,
): BasketMachine {
  if (!canDeposit(machine)) return machine
  const material = MATERIAL_BY_ID[action.materialId]
  const targetKg = round(lerp(material.minKg, material.maxKg, clamp01(action.unit)), 2)
  const started = enter(machine, 'detecting', {
    materialId: material.id,
    manual: false,
    seed: action.seed,
    targetKg,
    loadKg: 0,
    stepKg: 0,
    stableKg: 0,
    coupon: null,
    impactMs: 0,
  })
  return log(started, 'PRESENCE', `Material acercándose a la boca de la cesta · ${material.label}`)
}

function cancelDeposit(machine: BasketMachine, message: string): BasketMachine {
  const cleared = enter(machine, 'idle', {
    items: machine.items.filter((item) => item.state === 'settled'),
    materialId: null,
    manual: false,
    targetKg: 0,
    loadKg: 0,
    stepKg: 0,
    stableKg: 0,
    impactMs: 0,
  })
  return log(cleared, 'HX711', message)
}

function setManualWeight(
  machine: BasketMachine,
  action: Extract<BasketAction, { type: 'SET_MANUAL_WEIGHT' }>,
): BasketMachine {
  const kg = round(clampWeight(action.kg), 3)
  const tooLight = kg < LIMITS.minManualKg

  switch (machine.state) {
    case 'idle': {
      if (tooLight || isBinFull(machine)) return machine
      const started = startDropping(
        enter(machine, 'detecting', {
          materialId: 'mixta',
          manual: true,
          seed: action.seed,
          targetKg: kg,
          stableKg: 0,
          coupon: null,
          presenceCm: PRESENCE_SENSOR.nearCm,
        }),
      )
      return log(started, 'ESP32', `Modo manual · carga fijada en ${kgText(kg)}`)
    }
    case 'detecting':
    case 'dropping':
      if (tooLight) return cancelDeposit(machine, 'Depósito cancelado antes del pesaje')
      return { ...machine, manual: true, targetKg: kg }
    case 'weighing':
    case 'calculated': {
      if (tooLight) return cancelDeposit(machine, 'Carga retirada de las compuertas')
      const step = kg - machine.loadKg
      if (Math.abs(step) < 0.0005) return machine
      return enter(machine, 'weighing', {
        manual: true,
        targetKg: kg,
        loadKg: kg,
        stepKg: step,
        impactMs: 0,
        stableKg: 0,
      })
    }
    default:
      return machine
  }
}

function generate(
  machine: BasketMachine,
  action: Extract<BasketAction, { type: 'GENERATE' }>,
): BasketMachine {
  if (!canGenerate(machine)) return machine
  const discount = calculateDiscount(machine.stableKg)
  if (action.coupon.pct !== discount.pct) return machine
  const issued = enter(machine, 'qr', { coupon: action.coupon })
  return log(
    issued,
    'CUPON',
    `Cupón ${action.coupon.code} emitido · ${action.coupon.pct} % por ${kgText(machine.stableKg)}`,
  )
}

function cancel(machine: BasketMachine): BasketMachine {
  if (CANCELLABLE_STATES.includes(machine.state)) {
    return cancelDeposit(machine, 'Depósito cancelado · compuertas libres')
  }
  if (BUSY_STATES.includes(machine.state)) return machine
  // idle / full: forget the previous coupon so the dashboard starts fresh.
  if (machine.coupon === null && machine.stableKg === 0) return machine
  return log({ ...machine, coupon: null, stableKg: 0 }, 'CUPON', 'Cupón anterior descartado')
}

function emptyBin(machine: BasketMachine): BasketMachine {
  if (!canEmpty(machine)) return machine
  const emptied = enter(machine, 'idle', {
    fillL: 0,
    items: machine.items.filter((item) => item.state !== 'settled'),
  })
  return log(emptied, 'VL53L0X', `Cesta vaciada por el operario · fondo a ${Math.round(tofDistanceMm(0))} mm`)
}

/* ------------------------------------------------------------------ */
/* Reducer                                                             */
/* ------------------------------------------------------------------ */

export function basketReducer(machine: BasketMachine, action: BasketAction): BasketMachine {
  switch (action.type) {
    case 'TICK':
      return tick(machine, action)
    case 'DEPOSIT':
      return deposit(machine, action)
    case 'SET_MANUAL_WEIGHT':
      return setManualWeight(machine, action)
    case 'GENERATE':
      return generate(machine, action)
    case 'CANCEL':
      return cancel(machine)
    case 'EMPTY_BIN':
      return emptyBin(machine)
  }
}

/** Bin fill threshold re-exported for UI copy. */
export const FULL_THRESHOLD_PCT = BIN.fullThresholdPct
