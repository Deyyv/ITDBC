import { STORES } from './stores.js'
import type { ImpactKpi, TrendPoint } from '../types/dashboard'

export const PLASTIC_TODAY_KG = 18.4
export const TREE_KG_FACTOR = 0.05

export const TREES_SAVED = Math.round(PLASTIC_TODAY_KG * TREE_KG_FACTOR * 10) / 10

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
