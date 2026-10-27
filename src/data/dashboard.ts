import { DISCOUNT_PER_KG, MAX_DISCOUNT_PCT } from '../lib/discount'
import { treesSaved } from '../lib/impact'
import { STORES } from './stores.js'
import type { ImpactKpi, TrendPoint } from '../types/dashboard'

export const PLASTIC_TODAY_KG = 18.4

export const TREES_SAVED = treesSaved(PLASTIC_TODAY_KG)

export const IMPACT_KPIS: ImpactKpi[] = [
  {
    id: 'plastic',
    label: 'Plástico recolectado hoy',
    value: PLASTIC_TODAY_KG,
    unit: 'kg',
    caption: 'Jornada escolar en curso',
    decimals: 1,
    tag: 'hoy',
    target: 25,
    targetLabel: 'Meta 25 kg',
  },
  {
    id: 'trees',
    label: 'Árboles salvados',
    value: TREES_SAVED,
    unit: 'árboles',
    caption: 'Estimación de impacto',
    decimals: 1,
    prefix: '≈ ',
    tag: 'estimado',
    target: 1.5,
    targetLabel: 'Meta 1,5',
  },
  {
    id: 'shops',
    label: 'Comercios locales afiliados',
    value: STORES.length,
    unit: 'locales',
    caption: 'Red del barrio',
    decimals: 0,
    tag: 'red',
    target: 5,
    targetLabel: 'Meta 5 locales',
  },
]

export const WEEKLY_TREND: TrendPoint[] = [
  { label: 'Lun', fullLabel: 'Lunes', kg: 12.4 },
  { label: 'Mar', fullLabel: 'Martes', kg: 18.2 },
  { label: 'Mié', fullLabel: 'Miércoles', kg: 14.8 },
  { label: 'Jue', fullLabel: 'Jueves', kg: 22.6 },
  { label: 'Vie', fullLabel: 'Viernes', kg: 19.4 },
  { label: 'Sáb', fullLabel: 'Sábado', kg: 26.8 },
  { label: 'Dom', fullLabel: 'Domingo', kg: 24.1 },
]

export const WEEKLY_TOTAL = WEEKLY_TREND.reduce((total, point) => total + point.kg, 0)
export const WEEKLY_GOAL = 150
export const WEEKLY_DELTA_PCT = 18

export const DEMO_NOTE = 'Datos de demostración'

export type DashSection = { id: string; label: string }

/** Sections of the dashboard page, in scroll order; the top bar links to them. */
export const DASH_SECTIONS: readonly DashSection[] = [
  { id: 'estacion', label: 'Estación' },
  { id: 'telemetria', label: 'Telemetría' },
  { id: 'impacto', label: 'Impacto' },
  { id: 'ficha', label: 'Ficha técnica' },
]

export const DASH_SECTION_IDS: readonly string[] = DASH_SECTIONS.map((section) => section.id)

export type HowItWorksStep = { title: string; text: string }

export const HOW_IT_WORKS: readonly HowItWorksStep[] = [
  {
    title: 'Depositar',
    text: 'El sensor de presencia detecta el objeto en la boca de la cesta y el material cae sobre las compuertas cerradas.',
  },
  {
    title: 'Pesar',
    text: 'La celda de carga mide el peso. La lectura se congela cuando se mantiene estable durante un segundo.',
  },
  {
    title: 'Cupón QR',
    text: `Con el peso estable se calcula el descuento (${DISCOUNT_PER_KG} % por kilo, hasta ${MAX_DISCOUNT_PCT} %) y se emite un cupón con código QR.`,
  },
  {
    title: 'Descarga',
    text: 'El servo abre las compuertas, el material cae a la cesta inferior y la galga vuelve a cero.',
  },
]
