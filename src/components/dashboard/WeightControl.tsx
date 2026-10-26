import * as Slider from '@radix-ui/react-slider'
import { RotateCcw, Sparkles } from 'lucide-react'
import { SCALE_MAX_KG } from '../../lib/discount'
import { formatCompactNumber, formatKg } from '../../lib/format'

const PRESETS = [0.8, 2.5, 3.7, 5]

/** Visible keyboard focus on the dark deck. */
const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dash-lime focus-visible:ring-offset-2 focus-visible:ring-offset-dash-forest'

type WeightControlProps = {
  weightKg: number
  /** False when there is no load to remove or the coupon sequence is running. */
  canReset: boolean
  onChange: (weightKg: number) => void
  onSimulate: () => void
  onReset: () => void
}

/** Manual calibration: places a load of the chosen weight directly on the flaps. */
export default function WeightControl({
  weightKg,
  canReset,
  onChange,
  onSimulate,
  onReset,
}: WeightControlProps) {
  return (
    <div className="pt-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white/85">Ajuste de galga</p>
          <p className="mt-0.5 text-xs text-white/70">Desliza para simular la lectura del sensor.</p>
        </div>
        <button
          type="button"
          onClick={onReset}
          disabled={!canReset}
          className={`inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border border-white/25 px-3 text-xs font-semibold text-white/85 transition-colors hover:border-white/45 hover:text-white disabled:cursor-not-allowed disabled:border-white/15 disabled:text-white/55 ${focusRing}`}
        >
          <RotateCcw size={13} strokeWidth={2.2} aria-hidden="true" />
          Retirar carga
        </button>
      </div>

      <Slider.Root
        className="relative mt-3 flex h-9 w-full touch-none select-none items-center"
        min={0}
        max={SCALE_MAX_KG}
        step={0.05}
        value={[weightKg]}
        onValueChange={([value]) => onChange(value)}
        aria-label="Peso de plástico sobre la galga"
      >
        <Slider.Track className="relative h-2 grow overflow-hidden rounded-full bg-white/15">
          <Slider.Range className="absolute h-full rounded-full bg-dash-signal" />
        </Slider.Track>
        <Slider.Thumb
          className={`block h-7 w-7 rounded-full border-[3px] border-dash-forest bg-dash-signal shadow-[0_4px_14px_rgba(0,0,0,0.35)] transition-transform hover:scale-110 active:scale-95 ${focusRing}`}
          aria-label="Peso de plástico en kilogramos"
          aria-valuetext={`${formatKg(weightKg)} detectados`}
        />
      </Slider.Root>

      <div className="mt-0.5 flex justify-between font-mono text-xs tabular-nums text-white/65" aria-hidden="true">
        <span>0</span>
        <span>1</span>
        <span>2</span>
        <span>3</span>
        <span>4</span>
        <span>5 kg</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {PRESETS.map((preset) => {
          const active = Math.abs(weightKg - preset) < 0.001
          return (
            <button
              key={preset}
              type="button"
              onClick={() => onChange(preset)}
              className={`min-h-10 rounded-full border px-3 font-mono text-xs tabular-nums transition-colors ${focusRing} ${
                active
                  ? 'border-dash-signal bg-dash-signal text-dash-forest'
                  : 'border-white/20 text-white/80 hover:border-white/40 hover:text-white'
              }`}
              aria-pressed={active}
            >
              {formatCompactNumber(preset, preset % 1 === 0 ? 0 : 1)} kg
            </button>
          )
        })}
        <button
          type="button"
          onClick={onSimulate}
          className={`ml-auto inline-flex min-h-10 items-center gap-1.5 rounded-full border border-dash-lime/40 px-3 text-xs font-semibold text-dash-lime transition-colors hover:border-dash-lime hover:bg-dash-lime/10 ${focusRing}`}
        >
          <Sparkles size={13} strokeWidth={2.1} aria-hidden="true" />
          Lectura de prueba
        </button>
      </div>
    </div>
  )
}
