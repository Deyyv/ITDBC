import { formatDate, formatKg, toIsoDate } from './format'

export const COUPON_VALID_DAYS = 7

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

const randomCode = (length = 6) => {
  let output = ''
  try {
    const bytes = new Uint8Array(length)
    crypto.getRandomValues(bytes)
    for (let index = 0; index < length; index += 1) {
      output += ALPHABET[bytes[index] % ALPHABET.length]
    }
  } catch {
    for (let index = 0; index < length; index += 1) {
      output += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
    }
  }
  return output
}

export type SimulatorCoupon = {
  code: string
  pct: number
  weightKg: number
  weightLabel: string
  issuedAt: string
  expiresAt: string
  issuedLabel: string
  expiresLabel: string
  payload: string
}

export function buildSimulatorCoupon(weightKg: number, pct: number): SimulatorCoupon {
  const issuedAt = new Date()
  const expiresAt = new Date(issuedAt.getTime() + COUPON_VALID_DAYS * 24 * 60 * 60 * 1000)
  const code = `RP-${randomCode(6)}`
  const weightLabel = formatKg(weightKg)

  const payload = [
    'RECICLAPOINT · CUPÓN DE DESCUENTO',
    `Código: ${code}`,
    `Descuento: ${pct}%`,
    `Peso registrado: ${weightLabel}`,
    `Emitido: ${toIsoDate(issuedAt)}`,
    `Válido hasta: ${toIsoDate(expiresAt)}`,
    'Tope de descuento: 30%',
    'Redimible en tiendas aliadas del barrio',
  ].join('\n')

  return {
    code,
    pct,
    weightKg,
    weightLabel,
    issuedAt: issuedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    issuedLabel: formatDate(issuedAt),
    expiresLabel: formatDate(expiresAt),
    payload,
  }
}
