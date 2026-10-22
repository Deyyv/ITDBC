import * as Slider from '@radix-ui/react-slider'
import { RotateCcw, Sparkles } from 'lucide-react'
import { SCALE_MAX_KG } from '../../lib/discount'
import { formatCompactNumber, formatKg } from '../../lib/format'

const PRESETS = [0.8, 2.5, 3.7, 5]

type WeightControlProps = {
  weightKg: number
  onChange: (weightKg: number) => void
  onSimulate: () => void
  onReset: () => void
}

export default function WeightControl({
  weightKg,
  onChange,
  onSimulate,
  onReset,
}: WeightControlProps) {
  return (
    <div className="mt-auto pt-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[0.59rem] tracking-[0.06em] text-white/38">
            Ajuste de galga
          </p>
          <p className="mt-0.5 text-[0.76rem] text-white/58">
            Desliza para simular la lectura del sensor
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[0.66rem] font-semibold text-white/60 transition-colors hover:border-white/20 hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dash-signal"
        >
          <RotateCcw size={12} strokeWidth={2.2} aria-hidden="true" />
          Vaciar
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
        <Slider.Track className="relative h-2 grow overflow-hidden rounded-full bg-white/10">
          <Slider.Range className="absolute h-full rounded-full bg-dash-signal" />
        </Slider.Track>
        <Slider.Thumb
          className="block h-7 w-7 rounded-full border-[3px] border-dash-forest bg-dash-signal shadow-[0_0_0_1px_rgba(58,221,127,0.5),0_4px_14px_rgba(0,0,0,0.35)] transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dash-lime focus-visible:ring-offset-2 focus-visible:ring-offset-dash-forest active:scale-95"
          aria-label="Peso de plástico en kilogramos"
          aria-valuetext={`${formatKg(weightKg)} detectados`}
        />
      </Slider.Root>

      <div className="mt-0.5 flex justify-between font-mono text-[0.55rem] text-white/30">
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
              className={`min-h-9 rounded-full border px-2.5 py-1.5 font-mono text-[0.64rem] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dash-signal ${
                active
                  ? 'border-dash-signal bg-dash-signal text-dash-forest'
                  : 'border-white/10 bg-white/[0.04] text-white/60 hover:border-white/20 hover:bg-white/[0.08] hover:text-white'
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
          className="ml-auto inline-flex min-h-9 items-center gap-1.5 rounded-full border border-dash-lime/30 bg-dash-lime/[0.07] px-2.5 py-1.5 text-[0.64rem] font-semibold text-dash-lime transition-colors hover:border-dash-lime/50 hover:bg-dash-lime/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dash-lime"
        >
          <Sparkles size={12} strokeWidth={2.1} aria-hidden="true" />
          Lectura de prueba
        </button>
      </div>
    </div>
  )
}
