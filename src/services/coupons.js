export const COUPON_DAYS_VALID = 7

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

const randomCode = (len = 6) => {
  let out = ''
  try {
    const bytes = new Uint8Array(len)
    crypto.getRandomValues(bytes)
    for (let i = 0; i < len; i++) out += ALPHABET[bytes[i] % ALPHABET.length]
  } catch {
    for (let i = 0; i < len; i++) out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  }
  return out
}

export function generateCouponCode(storeCode) {
  return `RP-${storeCode}-${randomCode(6)}`
}

const formatDate = (d) => d.toISOString().slice(0, 10)

export function buildCoupon({ store, email, weightMg, weightLabel, pct }) {
  const issuedAt = new Date()
  const validUntil = new Date(issuedAt.getTime() + COUPON_DAYS_VALID * 24 * 60 * 60 * 1000)
  const code = generateCouponCode(store.code)

  return {
    code,
    storeId: store.id,
    storeName: store.name,
    storeCode: store.code,
    email,
    pct,
    weightMg,
    weightLabel,
    issuedAt,
    validUntil,
    issuedLabel: formatDate(issuedAt),
    expiryLabel: formatDate(validUntil),
    payload: [
      'RECICLAPOINT — CUPÓN DE DESCUENTO',
      `Tienda aliada: ${store.name}`,
      `Cliente: ${email}`,
      `Descuento: ${pct}%`,
      `Material reciclado: ${weightLabel}`,
      `Código: ${code}`,
      `Emitido: ${formatDate(issuedAt)}`,
      `Válido hasta: ${formatDate(validUntil)}`,
    ].join('\n'),
  }
}