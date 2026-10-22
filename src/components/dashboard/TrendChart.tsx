import { useState } from 'react'
import { TrendingUp } from 'lucide-react'
import {
  WEEKLY_DELTA_PCT,
  WEEKLY_GOAL,
  WEEKLY_TOTAL,
  WEEKLY_TREND,
} from '../../data/dashboard'
import { formatCompactNumber, formatKg } from '../../lib/format'

const MAX_VALUE = 30
const X_PADDING = 4

const xFor = (index: number) =>
  X_PADDING + (index / (WEEKLY_TREND.length - 1)) * (100 - X_PADDING * 2)

const yFor = (value: number) => 100 - (value / MAX_VALUE) * 100

const POINTS = WEEKLY_TREND.map((point, index) => ({
  ...point,
  x: xFor(index),
  y: yFor(point.kg),
}))

const LINE_PATH = POINTS.map(
  (point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`,
).join(' ')

const AREA_PATH = `${LINE_PATH} L ${POINTS[POINTS.length - 1].x} 100 L ${POINTS[0].x} 100 Z`

const GRID_VALUES = [30, 20, 10, 0]

const goalProgress = Math.min(100, Math.round((WEEKLY_TOTAL / WEEKLY_GOAL) * 100))

export default function TrendChart() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const activePoint = activeIndex === null ? null : POINTS[activeIndex]

  return (
    <section className="dash-panel dash-trend flex min-h-0 flex-col p-4 xl:p-5" aria-labelledby="trend-title">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-mono text-[0.59rem] tracking-[0.08em] text-dash-muted">
            03 · Comunidad educativa
          </p>
          <h2
            id="trend-title"
            className="mt-1 font-disp text-[clamp(1.15rem,1.55vw,1.42rem)] font-medium leading-tight tracking-[-0.02em]"
          >
            Lo que recicla el colegio
          </h2>
        </div>
        <div className="text-right">
          <p className="font-disp text-[clamp(1.35rem,2vw,1.8rem)] font-medium leading-none tracking-[-0.03em]">
            {formatCompactNumber(WEEKLY_TOTAL, 1)}
            <span className="ml-1 font-sans text-[0.58rem] font-semibold text-dash-muted">kg</span>
          </p>
          <p className="mt-1 inline-flex items-center gap-1 text-[0.58rem] font-semibold text-dash-signalDeep">
            <TrendingUp size={11} strokeWidth={2.4} aria-hidden="true" />+{WEEKLY_DELTA_PCT}% esta semana
          </p>
        </div>
      </div>

      <div className="mt-2 flex min-h-0 flex-1 gap-2">
        <div
          className="flex w-5 shrink-0 flex-col justify-between pb-0.5 text-right font-mono text-[0.5rem] leading-none text-dash-muted/65"
          aria-hidden="true"
        >
          {GRID_VALUES.map((value) => (
            <span key={value}>{value}</span>
          ))}
        </div>

        <div
          className="relative min-h-[108px] min-w-0 flex-1"
          onMouseLeave={() => setActiveIndex(null)}
        >
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="dash-trend-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--dash-signal)" stopOpacity="0.34" />
                <stop offset="100%" stopColor="var(--dash-signal)" stopOpacity="0" />
              </linearGradient>
            </defs>

            {GRID_VALUES.map((value) => {
              const y = yFor(value)
              return (
                <line
                  key={value}
                  x1="0"
                  y1={y}
                  x2="100"
                  y2={y}
                  stroke="var(--dash-line)"
                  strokeWidth="1"
                  strokeDasharray={value === 0 ? undefined : '3 5'}
                  vectorEffect="non-scaling-stroke"
                />
              )
            })}

            <path d={AREA_PATH} fill="url(#dash-trend-fill)" className="dash-chart-area" />
            <path
              d={LINE_PATH}
              fill="none"
              stroke="var(--dash-signal-deep)"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              vectorEffect="non-scaling-stroke"
              className="dash-chart-line"
            />
          </svg>

          {activePoint && (
            <span
              className="pointer-events-none absolute bottom-0 top-0 z-10 border-l border-dashed border-dash-signalDeep/35"
              style={{ left: `${activePoint.x}%` }}
              aria-hidden="true"
            />
          )}

          {POINTS.map((point, index) => {
            const active = activeIndex === index
            return (
              <span
                key={point.label}
                className={`pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dash-signalDeep transition-all duration-200 ${
                  active ? 'h-2.5 w-2.5 bg-dash-signalDeep' : 'h-1.5 w-1.5 bg-white'
                }`}
                style={{ left: `${point.x}%`, top: `${point.y}%` }}
                aria-hidden="true"
              />
            )
          })}

          <div className="absolute inset-0 z-20 grid grid-cols-7">
            {POINTS.map((point, index) => (
              <button
                key={point.label}
                type="button"
                className="h-full w-full rounded-md border-0 bg-transparent focus-visible:bg-dash-signal/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-dash-signalDeep"
                onMouseEnter={() => setActiveIndex(index)}
                onFocus={() => setActiveIndex(index)}
                onBlur={() => setActiveIndex(null)}
                aria-label={`${point.fullLabel}: ${formatKg(point.kg, 1)} reciclados`}
              />
            ))}
          </div>

          {activePoint && (
            <div
              className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-[115%]"
              style={{ left: `${activePoint.x}%`, top: `${activePoint.y}%` }}
              aria-hidden="true"
            >
              <div className="whitespace-nowrap rounded-xl bg-dash-ink px-2.5 py-1.5 text-white shadow-[0_8px_22px_rgba(16,32,26,0.2)]">
                <p className="font-mono text-[0.55rem] text-white/55">{activePoint.fullLabel}</p>
                <p className="mt-0.5 font-sans text-[0.72rem] font-bold leading-none text-dash-lime">
                  {formatKg(activePoint.kg, 1)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="relative ml-7 mt-1 h-3" aria-hidden="true">
        {POINTS.map((point) => (
          <span
            key={point.label}
            className="absolute -translate-x-1/2 font-sans text-[0.55rem] text-dash-muted/75"
            style={{ left: `${point.x}%` }}
          >
            {point.label}
          </span>
        ))}
      </div>

      <div className="mt-auto pt-2">
        <div className="flex items-center justify-between text-[0.6rem]">
          <span className="text-dash-muted">Meta semanal · {WEEKLY_GOAL} kg</span>
          <span className="font-mono font-semibold text-dash-signalDeep">{goalProgress}%</span>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-dash-cement">
          <div
            className="h-full rounded-full bg-dash-signalDeep transition-[width] duration-500"
            style={{ width: `${goalProgress}%` }}
          />
        </div>
      </div>

      <div className="sr-only">
        <table>
          <caption>Tendencia de reciclaje de la comunidad educativa durante la última semana</caption>
          <thead>
            <tr>
              <th scope="col">Día</th>
              <th scope="col">Kilogramos reciclados</th>
            </tr>
          </thead>
          <tbody>
            {WEEKLY_TREND.map((point) => (
              <tr key={point.label}>
                <th scope="row">{point.fullLabel}</th>
                <td>{formatKg(point.kg, 1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
