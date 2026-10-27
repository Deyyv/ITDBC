const decimal = (value: number, digits: number) =>
  new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)

export const formatKg = (kg: number, digits = 2) => `${decimal(kg, digits)} kg`

export const formatPct = (pct: number) => `${decimal(pct, 0)} %`

export const formatCompactNumber = (value: number, digits = 0) =>
  decimal(value, digits)

export const formatDate = (date: Date | string) =>
  new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))

export const formatDateShort = (date: Date | string) =>
  new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(date))

export const toIsoDate = (date: Date) => date.toISOString().slice(0, 10)

/** Whole number with a true minus sign (U+2212) instead of a hyphen, e.g. `−54`. */
export const formatMinus = (value: number) =>
  `${value < 0 ? '−' : ''}${Math.abs(Math.round(value))}`

/** Signal strength, e.g. `−54 dBm`. */
export const formatDbm = (dbm: number) => `${formatMinus(dbm)} dBm`

const pad2 = (value: number) => String(value).padStart(2, '0')

/** Firmware uptime as `hh:mm:ss`. */
export function formatUptime(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds % 60)}`
}

/** Serial-monitor timestamp from uptime milliseconds, e.g. `04:07.350`. */
export function formatLogTime(uptimeMs: number): string {
  const total = Math.max(0, Math.floor(uptimeMs))
  const minutes = Math.floor(total / 60_000)
  const seconds = Math.floor((total % 60_000) / 1000)
  return `${pad2(minutes)}:${pad2(seconds)}.${String(total % 1000).padStart(3, '0')}`
}
