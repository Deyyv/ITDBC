/** Screen-reader announcements and on-screen explanations for each machine state. */
import { formatKg } from '../format'
import {
  CAMERA_PRESETS,
  IDLE_WITH_COUPON_HELP,
  MACHINE_STATE_HELP,
  MACHINE_STATE_LABEL,
  PART_BY_ID,
} from './config'
import type { CameraPreset, MachineStateName, PartId } from './types'

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

/** What the viewer can change on the 3D twin itself (machine states are announced elsewhere). */
export type TwinViewState = {
  view: CameraPreset
  xray: boolean
  selectedPartId: PartId | null
}

function viewAnnouncement(view: CameraPreset): string {
  if (view === 'exploded') return 'Vista explosionada. Las piezas del ensamblaje se muestran separadas.'
  return `Vista ${CAMERA_PRESETS[view].label.toLowerCase()}.`
}

/**
 * Sentence for the polite live region of the twin, describing only what differs between two view
 * states: camera view (including the exploded one), X-ray and the selected part. Returns an empty
 * string when none of them changed.
 */
export function twinAnnouncement(previous: TwinViewState, next: TwinViewState): string {
  const sentences: string[] = []
  if (next.view !== previous.view) sentences.push(viewAnnouncement(next.view))
  if (next.xray !== previous.xray) {
    sentences.push(next.xray ? 'Rayos X activados.' : 'Rayos X desactivados.')
  }
  if (next.selectedPartId !== previous.selectedPartId) {
    sentences.push(
      next.selectedPartId
        ? `Pieza seleccionada: ${PART_BY_ID[next.selectedPartId].label}.`
        : 'Información de la pieza cerrada.',
    )
  }
  return sentences.join(' ')
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
