import { ChevronDown, Info, SlidersHorizontal } from 'lucide-react'
import type { BasketTwin } from '../../hooks/useBasketTwin'
import { stationAnnouncement, stationStatus } from '../../lib/basket/announce'
import { MAX_DISCOUNT_PCT } from '../../lib/discount'
import TwinStage from '../twin/TwinStage'
import DiscountReadout from './DiscountReadout'
import MachineStatusCard from './MachineStatusCard'
import QrPanel from './QrPanel'
import WeightControl from './WeightControl'
import WeightGauge from './WeightGauge'

type StationSectionProps = {
  twin: BasketTwin
}

/** Hero of the page: the 3D twin with its control bar, and the live status of the station. */
export default function StationSection({ twin }: StationSectionProps) {
  const {
    weightKg,
    stableWeightKg,
    targetKg,
    phase,
    machineState,
    coupon,
    discount,
    canGenerate,
    canReset,
    setWeight,
    simulateReading,
    generateCoupon,
    reset,
  } = twin

  const status = stationStatus(machineState, coupon !== null)
  const announcement = stationAnnouncement({
    state: machineState,
    discountPct: discount.pct,
    stableKg: stableWeightKg,
    coupon: coupon ? { code: coupon.code, pct: coupon.pct } : null,
  })

  return (
    <section id="estacion" className="dash-section dash-section--first" aria-labelledby="station-title">
      <div className="dash-container">
        <div className="dash-deck p-3 sm:p-5 xl:p-6">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:grid-rows-[auto_1fr] lg:gap-x-6">
            <header className="lg:col-start-2 lg:row-start-1">
              <h1
                id="station-title"
                className="font-disp text-[clamp(1.85rem,3vw,2.5rem)] font-medium leading-[1.05] tracking-[-0.02em] text-white"
              >
                Estación de reciclaje
              </h1>
              <p className="mt-2 max-w-[46ch] text-sm leading-relaxed text-white/75">
                Deposita plástico en la cesta: la galga lo pesa y la estación emite un cupón QR con hasta{' '}
                {MAX_DISCOUNT_PCT} % de descuento en tiendas aliadas del barrio.
              </p>
              <p className="mt-2 inline-flex items-start gap-1.5 text-xs leading-snug text-white/65">
                <Info size={13} className="mt-px shrink-0" aria-hidden="true" />
                Simulación en vivo: las lecturas de los sensores son generadas, no medidas.
              </p>
            </header>

            <div className="flex min-w-0 flex-col gap-3 lg:col-start-1 lg:row-span-2 lg:row-start-1">
              <TwinStage twin={twin} />

              <details className="dash-tile group">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-white/85 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-dash-lime [&::-webkit-details-marker]:hidden">
                  <span className="inline-flex items-center gap-2">
                    <SlidersHorizontal size={16} strokeWidth={2} aria-hidden="true" />
                    Modo manual (calibración)
                  </span>
                  <ChevronDown
                    size={16}
                    strokeWidth={2.2}
                    className="transition-transform group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                <div className="border-t border-white/10 px-4 pb-4">
                  <WeightControl
                    weightKg={targetKg}
                    canReset={canReset}
                    onChange={setWeight}
                    onSimulate={simulateReading}
                    onReset={reset}
                  />
                </div>
              </details>
            </div>

            <div className="flex min-w-0 flex-col gap-3 lg:col-start-2 lg:row-start-2">
              <MachineStatusCard status={status} />

              <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(14rem,1fr))]">
                <div className="dash-tile flex flex-col items-center justify-center gap-1 p-3">
                  <WeightGauge weightKg={weightKg} />
                  <p className="text-xs text-white/65">Peso sobre la galga</p>
                </div>
                <DiscountReadout discount={discount} phase={phase} />
              </div>

              <QrPanel
                phase={phase}
                coupon={coupon}
                discount={discount}
                canGenerate={canGenerate}
                canReset={canReset}
                onGenerate={generateCoupon}
                onReset={reset}
              />
            </div>
          </div>
        </div>

        <p className="sr-only" role="status" aria-live="polite">
          {announcement}
        </p>
      </div>
    </section>
  )
}
