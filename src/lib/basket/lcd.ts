/**
 * Text for the LCD 1602 and the small status OLED in the lid. The LCD charset has no accents, so
 * the copy is plain ASCII and every row fits in 16 characters.
 */
import { LCD_CONFIG } from './config'
import type { LcdFrame, LedMode, MachineStateName } from './types'

export type LcdInput = {
  state: MachineStateName
  weightKg: number
  discountPct: number
  hasCoupon: boolean
  rssiDbm: number
}

const fit = (text: string) => text.slice(0, LCD_CONFIG.columns)

const weightText = (kg: number) => `Peso: ${Math.max(0, kg).toFixed(2).padStart(5)} kg`

const discountText = (pct: number, status: string) =>
  fit(`Desc: ${pct}%`.padEnd(11) + status)

const OLED_STATE: Record<MachineStateName, string> = {
  idle: 'LISTO',
  detecting: 'DETECCION',
  dropping: 'DEPOSITO',
  weighing: 'PESANDO',
  calculated: 'CALCULADO',
  qr: 'CUPON',
  dumping: 'DESCARGA',
  closing: 'CIERRE',
  full: 'LLENA',
}

function ledFor(state: MachineStateName): LedMode {
  if (state === 'idle') return 'ready'
  if (state === 'full') return 'full'
  return 'busy'
}

function linesFor(input: LcdInput): readonly [string, string] {
  const { state, weightKg, discountPct, hasCoupon } = input

  switch (state) {
    case 'idle':
      return hasCoupon
        ? [fit('Cupon emitido'), discountText(discountPct, 'QR OK')]
        : [fit('Listo para pesar'), fit(weightText(0))]
    case 'detecting':
      return [fit('Objeto detectado'), fit('Espere...')]
    case 'dropping':
      return [fit('Recibiendo...'), fit(weightText(0))]
    case 'weighing':
      return [fit(weightText(weightKg)), fit('Pesando...')]
    case 'calculated':
      return [fit(weightText(weightKg)), discountText(discountPct, 'OK')]
    case 'qr':
      return [fit(weightText(weightKg)), discountText(discountPct, 'QR OK')]
    case 'dumping':
      return [fit('Descargando...'), fit('Gracias!')]
    case 'closing':
      return [fit('Cerrando...'), fit('Tarando balanza')]
    case 'full':
      return [fit('CESTA LLENA'), fit('Vaciar para usar')]
  }
}

export function formatLcd(input: LcdInput): LcdFrame {
  return {
    lines: linesFor(input),
    oled: [OLED_STATE[input.state], `${Math.round(input.rssiDbm)} dBm`],
    led: ledFor(input.state),
  }
}
