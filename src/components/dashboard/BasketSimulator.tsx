import { CheckCircle2, CircleDot, LoaderCircle } from 'lucide-react'
import { useWeighingSimulator } from '../../hooks/useWeighingSimulator'
import { formatKg } from '../../lib/format'
import type { SimulatorPhase } from '../../types/dashboard'
import DiscountReadout from './DiscountReadout'
import QrPanel from './QrPanel'
import WeightControl from './WeightControl'
import WeightGauge from './WeightGauge'

const STATUS: Record<
  SimulatorPhase,
  { label: string; className: string; dot: string }
> = {
  idle: {
    label: 'Esperando material',
    className: 'border-white/10 bg-white/[0.045] text-white/48',
    dot: 'bg-white/30',
  },
  weighing: {
    label: 'Pesando…',
    className: 'border-dash-lime/20 bg-dash-lime/[0.08] text-dash-lime',
    dot: 'bg-dash-lime',
  },
  calculated: {
    label: 'Descuento calculado',
    className: 'border-dash-signal/25 bg-dash-signal/[0.08] text-dash-signal',
    dot: 'bg-dash-signal',
  },
  qr: {
    label: 'QR generado',
    className: 'border-dash-signal bg-dash-signal text-dash-forest',
    dot: 'bg-dash-forest',
  },
}

function StatusPill({ phase }: { phase: SimulatorPhase }) {
  const status = STATUS[phase]
  const Icon = phase === 'qr' ? CheckCircle2 : phase === 'weighing' ? LoaderCircle : CircleDot

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1.5 font-mono text-[0.59rem] font-semibold transition-colors ${status.className}`}
    >
      <Icon
        size={12}
        strokeWidth={2.4}
        className={phase === 'weighing' ? 'animate-spin' : undefined}
        aria-hidden="true"
      />
      {status.label}
    </span>
  )
}

export default function BasketSimulator() {
  const simulator = useWeighingSimulator()
  const {
    weightKg,
    stableWeightKg,
    phase,
    coupon,
    discount,
    canGenerate,
    setWeight,
    simulateReading,
    generateCoupon,
    reset,
  } = simulator

  const announcement =
    phase === 'idle'
      ? 'Esperando material. La galga está en cero.'
      : phase === 'weighing'
        ? 'Pesando. La lectura de la galga se está estabilizando.'
        : phase === 'qr' && coupon
          ? `Cupón QR generado con ${coupon.pct} por ciento de descuento. Código ${coupon.code}.`
          : `Descuento calculado: ${discount.pct} por ciento para ${formatKg(stableWeightKg)} reciclados.`

  return (
    <section
      className="dash-deck dash-simulator p-4 sm:p-5 xl:p-6"
      aria-labelledby="simulator-title"
    >
      <div className="relative flex flex-wrap items-start justify-between gap-2.5">
        <div className="min-w-0">
          <p className="font-mono text-[0.59rem] tracking-[0.08em] text-white/35">
            01 · Módulo sensor
          </p>
          <h1
            id="simulator-title"
            className="mt-1 font-disp text-[clamp(1.45rem,2.3vw,2rem)] font-medium leading-none tracking-[-0.025em] text-white"
          >
            Simulador de cesta
          </h1>
          <p className="mt-1.5 max-w-[46ch] text-[0.78rem] leading-snug text-white/48">
            Deposita plástico en la galga de 5 kg y conviértelo en un cupón QR para el barrio.
          </p>
        </div>
        <StatusPill phase={phase} />
      </div>

      <div className="relative mt-3 grid min-h-0 flex-1 gap-3 lg:grid-cols-[1.05fr_0.95fr] xl:mt-4 xl:gap-4">
        <div className="flex min-h-0 flex-col">
          <WeightGauge weightKg={weightKg} />
          <WeightControl
            weightKg={weightKg}
            onChange={setWeight}
            onSimulate={simulateReading}
            onReset={reset}
          />
        </div>

        <div className="flex min-h-0 flex-col gap-2.5">
          <DiscountReadout discount={discount} phase={phase} />
          <QrPanel
            phase={phase}
            coupon={coupon}
            discount={discount}
            canGenerate={canGenerate}
            onGenerate={generateCoupon}
            onReset={reset}
          />
        </div>
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
    </section>
  )
}
