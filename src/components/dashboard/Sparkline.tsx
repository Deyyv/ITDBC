import { sparklineArea, sparklinePath } from '../../lib/sparkline'

const WIDTH = 100
const HEIGHT = 40

type SparklineProps = {
  values: readonly number[]
  min: number
  max: number
  /** Accessible description of what the chart shows (it is a picture of live numbers). */
  label: string
  className?: string
  /** Draws dashed guide lines at the given values. */
  guides?: readonly number[]
}

/** Live line chart that fills its box; stroke widths stay constant when it is stretched. */
export default function Sparkline({ values, min, max, label, className = 'h-24', guides = [] }: SparklineProps) {
  const box = { width: WIDTH, height: HEIGHT, min, max }
  const span = max - min

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={label}
      className={`w-full overflow-visible ${className}`}
    >
      {guides.map((value) => {
        const y = span > 0 ? HEIGHT - ((value - min) / span) * HEIGHT : HEIGHT
        return (
          <line
            key={value}
            x1="0"
            x2={WIDTH}
            y1={y}
            y2={y}
            stroke="var(--dash-line-strong)"
            strokeWidth="1"
            strokeDasharray="3 4"
            vectorEffect="non-scaling-stroke"
          />
        )
      })}
      <path d={sparklineArea(values, box)} fill="var(--dash-signal)" fillOpacity="0.16" />
      <path
        d={sparklinePath(values, box)}
        fill="none"
        stroke="var(--dash-signal-ink)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
