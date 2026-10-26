/** SVG path helpers for the small live charts of the telemetry cards. */

export type SparklineBox = {
  width: number
  height: number
  /** Value drawn on the bottom edge. */
  min: number
  /** Value drawn on the top edge. */
  max: number
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const round = (value: number) => Math.round(value * 100) / 100

/** Y coordinate (top = 0) of a value inside the box, clamped to its edges. */
export function sparklineY(value: number, { height, min, max }: SparklineBox): number {
  const span = max - min
  if (span <= 0) return height
  return round(height - clamp((value - min) / span, 0, 1) * height)
}

/** Polyline path through the samples, oldest on the left. Empty string when there is no data. */
export function sparklinePath(values: readonly number[], box: SparklineBox): string {
  if (values.length === 0) return ''
  if (values.length === 1) {
    const y = sparklineY(values[0], box)
    return `M0 ${y} L${box.width} ${y}`
  }
  const step = box.width / (values.length - 1)
  return values
    .map((value, index) => `${index === 0 ? 'M' : 'L'}${round(index * step)} ${sparklineY(value, box)}`)
    .join(' ')
}

/** Closed path under the line, for a soft fill. */
export function sparklineArea(values: readonly number[], box: SparklineBox): string {
  const line = sparklinePath(values, box)
  return line === '' ? '' : `${line} L${box.width} ${box.height} L0 ${box.height} Z`
}

/** Upper bound for a chart that must always show some headroom above its tallest sample. */
export function headroomMax(values: readonly number[], floor: number, headroom = 1.15): number {
  const peak = values.reduce((highest, value) => Math.max(highest, value), 0)
  return Math.max(floor, peak * headroom)
}
