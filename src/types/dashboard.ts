export type SimulatorPhase = 'idle' | 'weighing' | 'calculated' | 'qr'

export type ImpactKpiId = 'plastic' | 'trees' | 'shops'

export type ImpactKpi = {
  id: ImpactKpiId
  label: string
  value: number
  unit: string
  caption: string
  decimals: number
  prefix?: string
  tag: string
  target: number
  targetLabel: string
}

export type TrendPoint = {
  label: string
  fullLabel: string
  kg: number
}
