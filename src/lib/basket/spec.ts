/** Rows of the "Ficha técnica" tables, generated from the hardware and part constants. */
import { formatCompactNumber } from '../format'
import {
  BIN,
  HARDWARE,
  HX711_CONFIG,
  LOAD_CELL,
  PART_COLORS,
  PART_COLOR_LABEL,
  PART_DEFS,
  PRESENCE_SENSOR,
  SERVO_CONFIG,
  TOF_SENSOR,
} from './config'
import type { Vec3 } from './types'

export type PartRow = {
  id: string
  name: string
  role: string
  quantity: number
  /** `272 × 152 × 272 mm`, decimals only where the STL has them. */
  dimensions: string
  materialLabel: string
  /** CSS colour of the swatch, taken from the 3D material. */
  swatch: string
}

const dimension = (value: number) => formatCompactNumber(value, Number.isInteger(value) ? 0 : 1)

export function formatDimensionsMm(size: Vec3): string {
  return `${size.map(dimension).join(' × ')} mm`
}

export function partRows(): PartRow[] {
  return PART_DEFS.map((part) => ({
    id: part.id,
    name: part.label,
    role: part.description,
    quantity: part.quantity ?? 1,
    dimensions: formatDimensionsMm(part.sizeMm),
    materialLabel: PART_COLOR_LABEL[part.color],
    swatch: PART_COLORS[part.color].color,
  }))
}

export type ElectronicRow = {
  id: string
  /** What the component does in the station. */
  role: string
  model: string
  detail: string
}

export function electronicRows(): ElectronicRow[] {
  return [
    {
      id: 'controller',
      role: 'Controlador',
      model: HARDWARE.controller,
      detail: 'Lee los sensores, ejecuta la secuencia de la estación y publica la telemetría por Wi-Fi.',
    },
    {
      id: 'loadCell',
      role: 'Celda de carga',
      model: HARDWARE.loadCell,
      detail: `Mide el material sobre las compuertas. Capacidad nominal de ${LOAD_CELL.maxKg} kg.`,
    },
    {
      id: 'adc',
      role: 'Conversor de la galga',
      model: HARDWARE.adc,
      detail: `${HX711_CONFIG.samplesPerSecond} lecturas por segundo con filtro de mediana y promedio móvil.`,
    },
    {
      id: 'servo',
      role: 'Actuador de compuertas',
      model: HARDWARE.servo,
      detail: `Pulso de ${SERVO_CONFIG.minUs} a ${SERVO_CONFIG.maxUs} µs, ${SERVO_CONFIG.minDeg}° a ${SERVO_CONFIG.maxDeg}°; abre a ${SERVO_CONFIG.openDeg}°.`,
    },
    {
      id: 'presence',
      role: 'Detección de entrega',
      model: HARDWARE.presence,
      detail: `Detecta un objeto a menos de ${PRESENCE_SENSOR.thresholdCm} cm de la boca de la cesta.`,
    },
    {
      id: 'fill',
      role: 'Nivel de llenado',
      model: HARDWARE.fillSensor,
      detail: `Mide ${TOF_SENSOR.minMm} a ${TOF_SENSOR.maxMm} mm hasta el material; avisa al ${BIN.fullThresholdPct} % de llenado.`,
    },
    {
      id: 'display',
      role: 'Pantalla de estado',
      model: HARDWARE.display,
      detail: 'Dos filas de 16 caracteres y un OLED de 0,96" con el estado de la estación.',
    },
  ]
}

export const SPEC_NOTE =
  'Los sensores y sus valores son una configuración de referencia del prototipo. Las lecturas de la simulación se ajustan al montaje real en un único archivo de configuración.'
