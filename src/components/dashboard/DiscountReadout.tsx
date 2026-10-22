import { useAnimatedNumber } from '../../hooks/useAnimatedNumber'
import { MAX_DISCOUNT_PCT, type DiscountResult } from '../../lib/discount'
import { formatCompactNumber, formatKg } from '../../lib/format'
import type { SimulatorPhase } from '../../types/dashboard'

type DiscountReadoutProps = {
  discount: DiscountResult
  phase: SimulatorPhase
}

export default function DiscountReadout({ discount, phase }: DiscountReadoutProps) {
  const animatedPct = useAnimatedNumber(discount.pct, { duration: 520 })
  const progress = (discount.pct / MAX_DISCOUNT_PCT) * 100

  const caption =
    phase === 'weighing'
      ? 'Estabilizando lectura…'
      : discount.capped
        ? 'Tope de la galga alcanzado'
        : discount.pct > 0
          ? '6% por kg reciclado'
          : discount.nextPctAtKg
            ? `≈ ${formatKg(discount.nextPctAtKg, 2)} para el primer 1%`
            : 'Agrega material para empezar'

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] px-3.5 py-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-[0.59rem] tracking-[0.05em] text-white/38">
            Descuento estimado
          </p>
          <div className="mt-0.5 flex items-baseline gap-1" aria-hidden="true">
            <span className="font-disp text-[clamp(2.25rem,4.4vw,3.2rem)] font-medium leading-none tracking-[-0.05em] text-dash-signal">
              {formatCompactNumber(animatedPct, 0)}
            </span>
            <span className="text-lg font-semibold text-dash-signal/65">%</span>
          </div>
        </div>
        <span className="rounded-full border border-white/10 px-2 py-1 font-mono text-[0.56rem] text-white/38">
          máx. {MAX_DISCOUNT_PCT}%
        </span>
      </div>

      <div className="mt-2.5">
        <div
          className="relative h-1.5 overflow-hidden rounded-full bg-white/10"
          role="progressbar"
          aria-label="Descuento calculado"
          aria-valuemin={0}
          aria-valuemax={MAX_DISCOUNT_PCT}
          aria-valuenow={discount.pct}
          aria-valuetext={`${discount.pct} por ciento de descuento`}
        >
          <div
            className="h-full rounded-full bg-dash-signal transition-[width] duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
          <span
            className="absolute inset-y-0 w-px bg-white/25"
            style={{ left: '33.333%' }}
            aria-hidden="true"
          />
          <span
            className="absolute inset-y-0 w-px bg-white/25"
            style={{ left: '66.666%' }}
            aria-hidden="true"
          />
        </div>
        <div className="mt-1.5 flex items-center justify-between gap-2 text-[0.6rem]">
          <span className="truncate text-white/45">{caption}</span>
          <span className="shrink-0 font-mono text-white/28">0 / 30</span>
        </div>
      </div>
    </div>
  )
}
