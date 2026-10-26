/** Screen-reader announcements and on-screen explanations for each machine state. */
import { formatKg } from '../format'
import { IDLE_WITH_COUPON_HELP, MACHINE_STATE_HELP, MACHINE_STATE_LABEL } from './config'
import type { MachineStateName } from './types'

export type StationSnapshot = {
  state: MachineStateName
  discountPct: number
  stableKg: number
  coupon: { code: string; pct: number } | null
}

/** Sentence for the polite live region, read when the machine changes state. */
export function stationAnnouncement({ state, discountPct, stableKg, coupon }: StationSnapshot): string {
  switch (state) {
    case 'detecting':
      return 'Objeto detectado en la boca de la cesta.'
    case 'dropping':
      return 'Recibiendo material sobre las compuertas.'
    case 'weighing':
      return 'Pesando. La lectura de la galga se está estabilizando.'
    case 'calculated':
      return `Descuento calculado: ${discountPct} por ciento para ${formatKg(stableKg)} reciclados.`
    case 'qr':
      return coupon
        ? `Cupón QR generado con ${coupon.pct} por ciento de descuento. Código ${coupon.code}.`
        : 'Cupón QR generado.'
    case 'dumping':
      return 'Descargando el material en la cesta inferior.'
    case 'closing':
      return 'Cerrando compuertas y poniendo la galga en cero.'
    case 'full':
      return 'Cesta llena. Vacíala para seguir depositando.'
    case 'idle':
      return coupon
        ? `Listo para un nuevo depósito. Último cupón ${coupon.code} con ${coupon.pct} por ciento de descuento.`
        : 'Esperando material. La galga está en cero.'
  }
}

export type StationStatus = {
  /** State used to pick the label, tone and icon. */
  state: MachineStateName
  label: string
  help: string
}

/**
 * Label and explanation shown in the status card. After the dump the basket is idle again but the
 * coupon stays on screen, so that case keeps showing "QR generado".
 */
export function stationStatus(state: MachineStateName, hasCoupon: boolean): StationStatus {
  if (state === 'idle' && hasCoupon) {
    return { state: 'qr', label: MACHINE_STATE_LABEL.qr, help: IDLE_WITH_COUPON_HELP }
  }
  return { state, label: MACHINE_STATE_LABEL[state], help: MACHINE_STATE_HELP[state] }
}
