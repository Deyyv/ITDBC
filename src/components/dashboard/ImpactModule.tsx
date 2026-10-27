import { memo } from 'react'
import { Recycle, Store, TreePine } from 'lucide-react'
import { useAnimatedNumber } from '../../hooks/useAnimatedNumber'
import { DEMO_NOTE, IMPACT_KPIS } from '../../data/dashboard'
import { formatCompactNumber } from '../../lib/format'
import { goalProgressPct } from '../../lib/impact'
import type { ImpactKpi, ImpactKpiId } from '../../types/dashboard'

const ICONS: Record<ImpactKpiId, typeof Recycle> = {
  plastic: Recycle,
  trees: TreePine,
  shops: Store,
}

const BARS: Record<ImpactKpiId, string> = {
  plastic: 'bg-dash-signalDeep',
  trees: 'bg-dash-forest',
  shops: 'bg-dash-muted',
}

function KpiRow({ kpi }: { kpi: ImpactKpi }) {
  const animated = useAnimatedNumber(kpi.value, { duration: 850 })
  const Icon = ICONS[kpi.id]
  const progress = goalProgressPct(kpi.value, kpi.target)

  return (
    <li className="flex gap-4 py-5 first:pt-0 last:pb-0">
      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-dash-sage text-dash-forest">
        <Icon size={20} strokeWidth={1.9} aria-hidden="true" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <p className="text-sm font-semibold text-dash-ink">{kpi.label}</p>
          <p className="text-xs text-dash-muted">{kpi.caption}</p>
        </div>

        <p className="mt-1 flex items-baseline gap-1.5 font-disp text-[2rem] font-medium leading-none tracking-[-0.03em] tabular-nums text-dash-ink">
          <span>
            {kpi.prefix}
            {formatCompactNumber(animated, kpi.decimals)}
          </span>
          <span className="font-sans text-sm font-semibold tracking-normal text-dash-muted">{kpi.unit}</span>
        </p>

        <div className="mt-3 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-dash-cement">
            <div
              className={`h-full rounded-full transition-[width] duration-500 ${BARS[kpi.id]}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="shrink-0 text-xs tabular-nums text-dash-muted">
            {kpi.targetLabel} · {progress} %
          </span>
        </div>
      </div>
    </li>
  )
}

function ImpactModule() {
  return (
    <section className="dash-panel flex flex-col p-5 sm:p-6" aria-labelledby="impact-title">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3
          id="impact-title"
          className="font-disp text-[1.35rem] font-medium leading-tight tracking-[-0.02em] text-dash-ink"
        >
          La cesta también suma
        </h3>
        <span className="rounded-full bg-dash-cement px-2.5 py-1 text-xs font-semibold text-dash-muted">
          {DEMO_NOTE}
        </span>
      </div>

      <ul className="mt-5 divide-y divide-dash-line">
        {IMPACT_KPIS.map((kpi) => (
          <KpiRow key={kpi.id} kpi={kpi} />
        ))}
      </ul>
    </section>
  )
}

/** Static data: memoised so the 10 Hz telemetry of the page never re-renders it. */
export default memo(ImpactModule)
