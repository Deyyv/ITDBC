import { useEffect, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { Check, Copy, LoaderCircle, QrCode, RotateCcw, Sparkles } from 'lucide-react'
import type { SimulatorCoupon } from '../../lib/coupon'
import type { DiscountResult } from '../../lib/discount'
import { formatPct } from '../../lib/format'
import type { SimulatorPhase } from '../../types/dashboard'

type QrPanelProps = {
  phase: SimulatorPhase
  coupon: SimulatorCoupon | null
  discount: DiscountResult
  canGenerate: boolean
  onGenerate: () => void
  onReset: () => void
}

const stateLabel: Record<SimulatorPhase, string> = {
  idle: 'Pendiente',
  weighing: 'Pesando',
  calculated: 'Listo',
  qr: 'Emitido',
}

const placeholderCopy: Record<Exclude<SimulatorPhase, 'qr'>, string> = {
  idle: 'El cupón aparecerá al detectar material.',
  weighing: 'Estabilizando la lectura de la galga…',
  calculated: 'Lectura estable. Ya puedes emitir el cupón.',
}

export default function QrPanel({
  phase,
  coupon,
  discount,
  canGenerate,
  onGenerate,
  onReset,
}: QrPanelProps) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setCopied(false)
  }, [coupon?.code])

  const copyCode = async () => {
    if (!coupon) return
    try {
      await navigator.clipboard.writeText(coupon.code)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  const placeholderPhase = phase === 'qr' ? 'calculated' : phase

  const buttonCopy =
    phase === 'weighing'
      ? 'Esperando lectura estable'
      : phase === 'calculated' && discount.pct === 0
        ? 'Agrega más material'
        : 'Generar cupón QR'

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-white/10 bg-white/[0.045] p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="inline-flex items-center gap-1.5 font-mono text-[0.59rem] tracking-[0.05em] text-white/38">
          <QrCode size={12} strokeWidth={2} aria-hidden="true" />
          Cupón QR
        </p>
        <span
          className={`rounded-full px-2 py-0.5 font-mono text-[0.55rem] ${
            phase === 'qr'
              ? 'bg-dash-signal text-dash-forest'
              : phase === 'calculated'
                ? 'bg-dash-signal/15 text-dash-signal'
                : phase === 'weighing'
                  ? 'bg-dash-lime/10 text-dash-lime/80'
                  : 'bg-white/[0.06] text-white/38'
          }`}
        >
          {stateLabel[phase]}
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 py-2">
        <div
          className="relative shrink-0"
          style={{ width: 'clamp(128px, 21vh, 196px)' }}
        >
          <span className="dash-qr-corner -left-1 -top-1 rounded-tl border-l-2 border-t-2" aria-hidden="true" />
          <span className="dash-qr-corner -right-1 -top-1 rounded-tr border-r-2 border-t-2" aria-hidden="true" />
          <span className="dash-qr-corner -bottom-1 -left-1 rounded-bl border-b-2 border-l-2" aria-hidden="true" />
          <span className="dash-qr-corner -bottom-1 -right-1 rounded-br border-b-2 border-r-2" aria-hidden="true" />

          {phase === 'qr' && coupon ? (
            <div className="dash-qr-frame">
              <div className="relative overflow-hidden rounded-[10px]">
                <QRCodeCanvas
                  value={coupon.payload}
                  size={256}
                  bgColor="#FFFFFF"
                  fgColor="#10201A"
                  level="M"
                  marginSize={1}
                  className="!block !h-auto !w-full"
                  aria-label={`Código QR del cupón ${coupon.code}, ${formatPct(coupon.pct)} de descuento`}
                />
                <span className="dash-scanline" aria-hidden="true" />
              </div>
            </div>
          ) : (
            <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-[14px] border border-dashed border-white/15 bg-dash-forest2/55">
              {phase === 'weighing' && (
                <span className="dash-shimmer absolute inset-0" aria-hidden="true" />
              )}
              {phase === 'weighing' ? (
                <LoaderCircle
                  size={27}
                  strokeWidth={1.5}
                  className="animate-spin text-dash-lime/70"
                  aria-hidden="true"
                />
              ) : phase === 'calculated' ? (
                <Sparkles
                  size={27}
                  strokeWidth={1.5}
                  className="text-dash-signal"
                  aria-hidden="true"
                />
              ) : (
                <QrCode size={27} strokeWidth={1.4} className="text-white/25" aria-hidden="true" />
              )}
              <span className="absolute inset-x-3 bottom-2.5 text-center text-[0.55rem] leading-tight text-white/35">
                {placeholderCopy[placeholderPhase]}
              </span>
            </div>
          )}
        </div>

        {phase === 'qr' && coupon ? (
          <div className="text-center">
            <p className="font-mono text-[0.55rem] text-white/32">Código del cupón</p>
            <p className="mt-0.5 font-mono text-[0.78rem] font-semibold tracking-[0.1em] text-dash-lime">
              {coupon.code}
            </p>
            <p className="mt-0.5 text-[0.58rem] text-white/35">
              Válido hasta {coupon.expiresLabel}
            </p>
          </div>
        ) : (
          <p className="max-w-[30ch] text-center text-[0.6rem] leading-snug text-white/32">
            Escanea el cupón en cualquiera de los comercios aliados.
          </p>
        )}
      </div>

      {phase === 'qr' && coupon ? (
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={copyCode}
            className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full bg-dash-signal px-2 py-1.5 text-[0.66rem] font-bold text-dash-forest transition-colors hover:bg-dash-lime focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dash-lime"
          >
            {copied ? (
              <Check size={12} strokeWidth={2.5} aria-hidden="true" />
            ) : (
              <Copy size={12} strokeWidth={2.2} aria-hidden="true" />
            )}
            {copied ? 'Copiado' : 'Copiar código'}
          </button>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border border-white/12 bg-white/[0.04] px-2 py-1.5 text-[0.66rem] font-semibold text-white/62 transition-colors hover:border-white/25 hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dash-signal"
          >
            <RotateCcw size={12} strokeWidth={2.2} aria-hidden="true" />
            Nuevo pesaje
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onGenerate}
          disabled={!canGenerate}
          className="inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-full bg-dash-signal px-3 py-1.5 text-[0.68rem] font-bold text-dash-forest transition-all hover:bg-dash-lime focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dash-lime disabled:cursor-not-allowed disabled:bg-white/[0.06] disabled:text-white/32"
        >
          <QrCode size={13} strokeWidth={2.3} aria-hidden="true" />
          {buttonCopy}
        </button>
      )}

      <span className="sr-only" role="status" aria-live="polite">
        {copied ? 'Código copiado al portapapeles' : ''}
      </span>
    </div>
  )
}
