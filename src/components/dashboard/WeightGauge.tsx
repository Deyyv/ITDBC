import { SCALE_MAX_KG, clampWeight } from '../../lib/discount'
import { formatCompactNumber } from '../../lib/format'

const CX = 160
const CY = 170
const RADIUS = 116
const START_ANGLE = 150
const END_ANGLE = 390
const SWEEP = END_ANGLE - START_ANGLE

type Point = { x: number; y: number }

const polar = (angle: number, radius = RADIUS): Point => {
  const radians = (angle * Math.PI) / 180
  return {
    x: CX + radius * Math.cos(radians),
    y: CY + radius * Math.sin(radians),
  }
}

const arcPath = () => {
  const start = polar(START_ANGLE)
  const end = polar(END_ANGLE)
  return `M ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 1 1 ${end.x} ${end.y}`
}

const angleForWeight = (weightKg: number) => START_ANGLE + (weightKg / SCALE_MAX_KG) * SWEEP

const TICKS = Array.from({ length: 21 }, (_, index) => index * 0.25)

type WeightGaugeProps = {
  weightKg: number
}

export default function WeightGauge({ weightKg }: WeightGaugeProps) {
  const safeWeight = clampWeight(weightKg)
  const progress = safeWeight / SCALE_MAX_KG
  const needlePoint = polar(angleForWeight(safeWeight), RADIUS - 11)
  const activePoint = polar(angleForWeight(safeWeight), RADIUS)

  return (
    <div
      className="relative mx-auto w-full max-w-[370px]"
      role="img"
      aria-label={`Galga de carga: ${formatCompactNumber(safeWeight, 2)} kilogramos de ${SCALE_MAX_KG} kilogramos`}
    >
      <svg viewBox="0 0 320 216" className="w-full overflow-visible" aria-hidden="true">
        <path
          d={arcPath()}
          fill="none"
          strokeWidth="13"
          strokeLinecap="round"
          pathLength={100}
          className="dash-gauge-track"
        />
        {safeWeight > 0 && (
          <path
            d={arcPath()}
            fill="none"
            strokeWidth="13"
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray={`${progress * 100} 100`}
            className="dash-gauge-value"
          />
        )}

        {TICKS.map((value) => {
          const major = Number.isInteger(value)
          const angle = angleForWeight(value)
          const outer = polar(angle, RADIUS - (major ? 20 : 17))
          const inner = polar(angle, RADIUS - (major ? 28 : 24))
          return (
            <line
              key={value}
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              strokeWidth={major ? 1.5 : 1}
              className="dash-gauge-tick"
              opacity={major ? 0.9 : 0.55}
            />
          )
        })}

        {Array.from({ length: SCALE_MAX_KG + 1 }, (_, value) => {
          const label = polar(angleForWeight(value), RADIUS - 43)
          return (
            <text
              key={value}
              x={label.x}
              y={label.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="9.5"
              fontFamily="ui-monospace, SFMono-Regular, Consolas, monospace"
              className="dash-gauge-caption"
            >
              {value}
            </text>
          )
        })}

        {safeWeight > 0 && (
          <circle
            cx={activePoint.x}
            cy={activePoint.y}
            r="5"
            fill="var(--dash-lime)"
            stroke="var(--dash-forest)"
            strokeWidth="2"
          />
        )}

        <line
          x1={CX}
          y1={CY}
          x2={needlePoint.x}
          y2={needlePoint.y}
          stroke="var(--dash-lime)"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity={safeWeight > 0 ? 0.75 : 0.25}
        />
        <circle cx={CX} cy={CY} r="3.2" fill="var(--dash-lime)" opacity={safeWeight > 0 ? 0.9 : 0.3} />
      </svg>

      <div className="pointer-events-none absolute inset-x-0 bottom-[3%] text-center">
        <div className="flex items-start justify-center gap-1.5">
          <span className="font-disp text-[clamp(2.7rem,6.2vh,4.4rem)] font-medium leading-[0.86] tracking-[-0.045em] text-white">
            {formatCompactNumber(safeWeight, 2)}
          </span>
          <span className="mt-1.5 font-mono text-[0.65rem] text-white/45">kg</span>
        </div>
        <p className="mt-1.5 font-mono text-[0.57rem] tracking-[0.04em] text-white/38">
          Peso sobre la galga
        </p>
      </div>
    </div>
  )
}
