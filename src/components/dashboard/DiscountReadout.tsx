import { useAnimatedNumber } from '../../hooks/useAnimatedNumber'
import { DISCOUNT_PER_KG, MAX_DISCOUNT_PCT, type DiscountResult } from '../../lib/discount'
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
          ? `${DISCOUNT_PER_KG} % por kilo reciclado`
          : discount.nextPctAtKg
            ? `≈ ${formatKg(discount.nextPctAtKg, 2)} para el primer 1 %`
            : 'Agrega material para empezar'

  return (
    <div className="dash-tile flex flex-col justify-between gap-3 p-4">
      <p className="text-xs font-semibold text-white/70">Descuento estimado</p>

      <div className="flex items-baseline gap-1" aria-hidden="true">
        <span className="font-disp text-[3.25rem] font-medium leading-none tracking-[-0.04em] tabular-nums text-dash-signal">
          {formatCompactNumber(animatedPct, 0)}
        </span>
        <span className="text-xl font-semibold text-dash-signal/80">%</span>
      </div>

      <div>
        <div
          className="relative h-2 overflow-hidden rounded-full bg-white/15"
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
        </div>
        <div className="mt-2 flex items-center justify-between gap-2 text-xs">
          <span className="text-white/75">{caption}</span>
          <span className="shrink-0 whitespace-nowrap font-mono tabular-nums text-white/65">
            máx. {MAX_DISCOUNT_PCT} %
          </span>
        </div>
      </div>
    </div>
  )
}
