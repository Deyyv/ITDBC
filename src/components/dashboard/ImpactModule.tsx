import { Recycle, Store, TreePine } from 'lucide-react'
import { useAnimatedNumber } from '../../hooks/useAnimatedNumber'
import { DEMO_NOTE, IMPACT_KPIS } from '../../data/dashboard'
import { formatCompactNumber } from '../../lib/format'
import type { ImpactKpi, ImpactKpiId } from '../../types/dashboard'

const ICONS: Record<ImpactKpiId, typeof Recycle> = {
  plastic: Recycle,
  trees: TreePine,
  shops: Store,
}

const TONES: Record<ImpactKpiId, string> = {
  plastic: 'bg-dash-signal/15 text-dash-signalDeep',
  trees: 'bg-dash-lime/35 text-dash-forest',
  shops: 'bg-dash-sage text-dash-forest',
}

const BARS: Record<ImpactKpiId, string> = {
  plastic: 'bg-dash-signalDeep',
  trees: 'bg-dash-forest',
  shops: 'bg-dash-muted',
}

function KpiCard({ kpi }: { kpi: ImpactKpi }) {
  const animated = useAnimatedNumber(kpi.value, { duration: 850 })
  const Icon = ICONS[kpi.id]
  const progress = Math.min(100, Math.round((kpi.value / kpi.target) * 100))

  return (
    <article className="group flex min-h-0 flex-1 items-center gap-3 rounded-2xl border border-dash-line bg-dash-cement/70 p-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-dash-sage hover:bg-white focus-within:border-dash-signalDeep">
      <span
        className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:-rotate-3 ${TONES[kpi.id]}`}
      >
        <Icon size={17} strokeWidth={1.9} aria-hidden="true" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-[0.66rem] font-semibold leading-tight text-dash-muted">
            {kpi.label}
          </p>
          <span className="shrink-0 font-mono text-[0.5rem] tracking-[0.04em] text-dash-muted/55">
            {kpi.tag}
          </span>
        </div>

        <div className="mt-0.5 flex items-baseline gap-2">
          <p className="flex items-baseline gap-1 font-disp text-[clamp(1.35rem,1.9vw,1.7rem)] font-medium leading-none tracking-[-0.03em] text-dash-ink">
            <span>
              {kpi.prefix}
              {formatCompactNumber(animated, kpi.decimals)}
            </span>
            <span className="font-sans text-[0.55rem] font-semibold text-dash-muted">{kpi.unit}</span>
          </p>
          <span className="ml-auto hidden truncate text-[0.53rem] leading-tight text-dash-muted/65 sm:block">
            {kpi.caption}
          </span>
        </div>

        <div className="mt-1.5 flex items-center gap-2">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-dash-line/70">
            <div
              className={`h-full rounded-full transition-[width] duration-500 ${BARS[kpi.id]}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="shrink-0 text-[0.49rem] leading-none text-dash-muted/65">{kpi.targetLabel}</span>
          <span className="shrink-0 font-mono text-[0.52rem] leading-none text-dash-muted/65">{progress}%</span>
        </div>
      </div>
    </article>
  )
}

export default function ImpactModule() {
  return (
    <section className="dash-panel dash-impact flex flex-col p-4 xl:p-5" aria-labelledby="impact-title">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-mono text-[0.59rem] tracking-[0.08em] text-dash-muted">
            02 · Impacto ecológico
          </p>
          <h2
            id="impact-title"
            className="mt-1 font-disp text-[clamp(1.15rem,1.55vw,1.42rem)] font-medium leading-tight tracking-[-0.02em]"
          >
            La cesta también suma
          </h2>
        </div>
        <span className="shrink-0 rounded-full border border-dash-line bg-dash-cement px-2 py-1 font-mono text-[0.52rem] text-dash-muted">
          {DEMO_NOTE}
        </span>
      </div>

      <div className="mt-3 flex min-h-0 flex-1 flex-col gap-2">
        {IMPACT_KPIS.map((kpi) => (
          <KpiCard key={kpi.id} kpi={kpi} />
        ))}
      </div>
    </section>
  )
}
