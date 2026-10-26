/** Shared domain types for the smart recycling basket simulation. */

/** Three-component vector (millimetres unless stated otherwise). */
export type Vec3 = readonly [number, number, number]

export type MachineStateName =
  | 'idle'
  | 'detecting'
  | 'dropping'
  | 'weighing'
  | 'calculated'
  | 'qr'
  | 'dumping'
  | 'closing'
  | 'full'

export type MaterialId = 'pet' | 'hdpe' | 'tapas' | 'mixta'

export type MaterialDef = {
  id: MaterialId
  label: string
  description: string
  minKg: number
  maxKg: number
  /** Compacted volume factor of the deposited material (litres per kilogram). */
  litersPerKg: number
  /** Rendered items per kilogram (3D scene only). */
  itemsPerKg: number
  minItems: number
  maxItems: number
}

export type DepositItemState = 'falling' | 'onFlaps' | 'dumping' | 'settled'

export type DepositItem = {
  id: number
  materialId: MaterialId
  seed: number
  state: DepositItemState
}

export type LogTag = 'HX711' | 'SERVO' | 'PRESENCE' | 'VL53L0X' | 'ESP32' | 'CUPON'

export type LogLine = {
  id: number
  /** Firmware uptime in milliseconds when the line was emitted. */
  t: number
  tag: LogTag
  message: string
}

export type PartId =
  | 'cesta-inferior'
  | 'anillo-central'
  | 'cesta-superior'
  | 'bandeja'
  | 'complemento-servo'
  | 'brazo-basculante'
  | 'guarda-motor'
  | 'caja-electrica'
  | 'tapa-caja-electrica'

export type SensorId = 'loadCell' | 'presence' | 'fill' | 'servo' | 'controller'

export type CameraPreset = 'iso' | 'front' | 'top' | 'exploded'

export type FlapHinge = 'walls' | 'center'

export type LedMode = 'ready' | 'busy' | 'full'

/** Text shown by the LCD 1602 (two 16-character rows) and the small status OLED. */
export type LcdFrame = {
  lines: readonly [string, string]
  oled: readonly [string, string]
  led: LedMode
}

/** Live sensor readings exposed to the UI and the 3D scene. */
export type BasketTelemetry = {
  hx711Raw: number
  /** Filtered weight in kilograms (median-of-3 + moving average, zero dead band). */
  hx711Kg: number
  stable: boolean
  /** Standard deviation of the last second of samples, in grams. */
  sigmaG: number
  /** Last 100 filtered readings (kg), oldest first. */
  history: readonly number[]
  presenceCm: number
  fillPct: number
  tofMm: number
  servoDeg: number
  servoUs: number
  rssiDbm: number
  uptimeS: number
  overload: boolean
}
