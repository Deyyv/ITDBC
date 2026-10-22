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
