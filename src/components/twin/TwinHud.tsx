import { Check, Eye, PackagePlus, Trash2, X } from 'lucide-react'
import {
  BIN,
  CAMERA_PRESETS,
  CAMERA_PRESET_ORDER,
  PART_BY_ID,
  PHASE_STEPS,
} from '../../lib/basket/config'
import { formatDimensionsMm } from '../../lib/basket/spec'
import type {
  BasketTelemetry,
  CameraPreset,
  MaterialDef,
  MaterialId,
  PartId,
} from '../../lib/basket/types'
import { formatCompactNumber, formatKg } from '../../lib/format'

/** Floating chips over the canvas: translucent so the model stays visible behind them. */
const chip = 'border border-white/15 bg-dash-forest/80 backdrop-blur-md'

/** Visible keyboard focus on the dark deck; same ring as the sensor hotspots. */
const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dash-lime focus-visible:ring-offset-2 focus-visible:ring-offset-dash-forest'

/* ------------------------------------------------------------------ */
/* Phase stepper                                                       */
/* ------------------------------------------------------------------ */

export function PhaseStepper({ activeIndex }: { activeIndex: number }) {
  return (
    <ol
      aria-label="Etapas del ciclo de reciclaje"
      className={`pointer-events-auto flex items-center gap-0.5 rounded-full p-1 ${chip}`}
    >
      {PHASE_STEPS.map((label, index) => {
        const active = index === activeIndex
        const done = activeIndex >= 0 && index < activeIndex
        return (
          <li
            key={label}
            aria-current={active ? 'step' : undefined}
            title={label}
            className={`flex h-7 items-center gap-1.5 rounded-full text-[11px] font-semibold leading-none transition-colors ${
              active
                ? 'bg-dash-signal pl-1 pr-3 text-dash-forest'
                : done
                  ? 'w-7 justify-center text-dash-signal'
                  : 'w-7 justify-center text-white/65'
            }`}
          >
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full tabular-nums ${
                active ? 'bg-dash-forest/15' : ''
              }`}
            >
              {done ? <Check size={12} strokeWidth={3} aria-hidden="true" /> : index + 1}
            </span>
            <span className={active ? undefined : 'sr-only'}>
              {label}
              {done && ' (completada)'}
              {active && ' (en curso)'}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

/* ------------------------------------------------------------------ */
/* Camera and X-ray controls                                           */
/* ------------------------------------------------------------------ */

type ViewButtonsProps = {
  view: CameraPreset
  onViewChange: (view: CameraPreset) => void
}

export function ViewButtons({ view, onViewChange }: ViewButtonsProps) {
  return (
    <div
      role="group"
      aria-label="Vista de cámara"
      className={`pointer-events-auto flex items-center gap-0.5 rounded-full p-1 ${chip}`}
    >
      {CAMERA_PRESET_ORDER.map((preset) => {
        const active = preset === view
        const { label, shortLabel } = CAMERA_PRESETS[preset]
        return (
          <button
            key={preset}
            type="button"
            aria-pressed={active}
            aria-label={label}
            onClick={() => onViewChange(preset)}
            className={`min-h-7 flex-1 rounded-full px-2.5 text-[11px] font-semibold transition-colors sm:flex-none ${focusRing} ${
              active ? 'bg-white text-dash-forest' : 'text-white/75 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span className="sm:hidden" aria-hidden="true">
              {shortLabel}
            </span>
            <span className="hidden sm:inline" aria-hidden="true">
              {label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

type XrayToggleProps = {
  xray: boolean
  onXrayChange: (xray: boolean) => void
}

export function XrayToggle({ xray, onXrayChange }: XrayToggleProps) {
  return (
    <button
      type="button"
      aria-pressed={xray}
      onClick={() => onXrayChange(!xray)}
      className={`pointer-events-auto inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-[11px] font-semibold transition-colors ${chip} ${focusRing} ${
        xray ? 'border-dash-lime/70 text-dash-lime' : 'text-white/75 hover:text-white'
      }`}
    >
      <Eye size={13} strokeWidth={2.2} aria-hidden="true" />
      Rayos X
    </button>
  )
}

/* ------------------------------------------------------------------ */
/* Small readouts and hint                                             */
/* ------------------------------------------------------------------ */

export function StageReadouts({ telemetry }: { telemetry: BasketTelemetry }) {
  return (
    <p
      aria-hidden="true"
      className="pointer-events-none flex flex-wrap gap-x-3 gap-y-0.5 rounded-lg bg-dash-forest/55 px-2.5 py-1.5 font-mono text-[11px] tabular-nums text-white/75"
    >
      <span>Peso {formatKg(telemetry.hx711Kg, 3)}</span>
      <span>Servo {formatCompactNumber(telemetry.servoDeg, 0)}°</span>
      <span>Nivel {formatCompactNumber(telemetry.fillPct, 0)} %</span>
    </p>
  )
}

export function StageHint() {
  return (
    <p className="pointer-events-none hidden rounded-lg bg-dash-forest/55 px-2.5 py-1.5 text-[11px] text-white/70 sm:block">
      Arrastra para girar · rueda para acercar · clic en una pieza para ver su ficha
    </p>
  )
}

/* ------------------------------------------------------------------ */
/* Deposit controls (control bar below the canvas)                     */
/* ------------------------------------------------------------------ */

type DepositControlsProps = {
  materials: readonly MaterialDef[]
  material: MaterialId
  onMaterialChange: (material: MaterialId) => void
  canDeposit: boolean
  isFull: boolean
  canEmpty: boolean
  fillPct: number
  onDeposit: () => void
  onEmpty: () => void
}

export function DepositControls({
  materials,
  material,
  onMaterialChange,
  canDeposit,
  isFull,
  canEmpty,
  fillPct,
  onDeposit,
  onEmpty,
}: DepositControlsProps) {
  const pct = Math.round(fillPct)
  const selected = materials.find((item) => item.id === material) ?? materials[0]

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span id="material-label" className="text-xs font-semibold text-white/75">
          Material
        </span>
        <div role="group" aria-labelledby="material-label" className="flex flex-wrap gap-1.5">
          {materials.map((item) => {
            const active = item.id === material
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={active}
                onClick={() => onMaterialChange(item.id)}
                className={`min-h-9 rounded-full border px-3 text-xs font-semibold transition-colors ${focusRing} ${
                  active
                    ? 'border-dash-signal bg-dash-signal/15 text-dash-signal'
                    : 'border-white/15 text-white/75 hover:border-white/35 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            )
          })}
        </div>
        {selected && (
          <p className="w-full text-xs text-white/65 xl:ml-auto xl:w-auto">
            {selected.description} Entre {formatKg(selected.minKg, 1)} y {formatKg(selected.maxKg, 1)}.
          </p>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={onDeposit}
          disabled={!canDeposit}
          className={`inline-flex min-h-11 items-center gap-2 rounded-full bg-dash-signal px-5 text-sm font-bold text-dash-forest transition-colors hover:bg-dash-lime disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/55 ${focusRing}`}
        >
          <PackagePlus size={16} strokeWidth={2.3} aria-hidden="true" />
          Depositar
        </button>
        <button
          type="button"
          onClick={onEmpty}
          disabled={!canEmpty}
          className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:border-white/10 disabled:text-white/50 ${focusRing} ${
            isFull
              ? 'border-amber-400 bg-amber-400 text-dash-forest hover:bg-amber-300 motion-safe:animate-pulse'
              : 'border-white/25 text-white/85 hover:border-white/45 hover:text-white'
          }`}
        >
          <Trash2 size={15} strokeWidth={2.2} aria-hidden="true" />
          Vaciar cesta
        </button>

        <div
          role="progressbar"
          aria-label="Nivel de llenado de la cesta"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          aria-valuetext={`${pct} por ciento${isFull ? ', cesta llena' : ''}`}
          className="flex min-w-[200px] flex-1 flex-col gap-1"
        >
          <div className="flex items-baseline justify-between text-xs text-white/70" aria-hidden="true">
            <span>Nivel de la cesta</span>
            <span className={`font-mono tabular-nums ${isFull ? 'font-bold text-amber-300' : ''}`}>
              {pct} %{isFull ? ' · llena' : ''}
            </span>
          </div>
          <div className="relative h-2 overflow-hidden rounded-full bg-white/15" aria-hidden="true">
            <div
              className={`h-full rounded-full transition-[width] duration-300 ${
                isFull ? 'bg-amber-400' : 'bg-dash-signal'
              }`}
              style={{ width: `${Math.min(100, pct)}%` }}
            />
            <span
              className="absolute inset-y-0 w-px bg-white/60"
              style={{ left: `${BIN.fullThresholdPct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Selected part                                                       */
/* ------------------------------------------------------------------ */

export function PartCard({ partId, onClose }: { partId: PartId; onClose: () => void }) {
  const part = PART_BY_ID[partId]
  return (
    <aside
      aria-label={`Información de la pieza: ${part.label}`}
      className={`pointer-events-auto w-full max-w-[290px] rounded-2xl p-3 ${chip}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] text-white/65">Pieza impresa</p>
          <h3 className="mt-0.5 text-sm font-semibold leading-tight text-white">{part.label}</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar información de la pieza"
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white ${focusRing}`}
        >
          <X size={14} strokeWidth={2.2} aria-hidden="true" />
        </button>
      </div>
      <p className="mt-1.5 text-xs leading-snug text-white/80">{part.description}</p>
      <p className="mt-2 font-mono text-[11px] tabular-nums text-dash-lime">
        {formatDimensionsMm(part.sizeMm)}
      </p>
    </aside>
  )
}
