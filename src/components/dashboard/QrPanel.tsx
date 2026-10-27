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
  /** False while the coupon / dump / close sequence runs and "Nuevo pesaje" would be ignored. */
  canReset: boolean
  onGenerate: () => void
  onReset: () => void
}

/** Visible keyboard focus on the dark deck. */
const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dash-lime focus-visible:ring-offset-2 focus-visible:ring-offset-dash-forest'

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
  canReset,
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

  const issuedCoupon = phase === 'qr' ? coupon : null

  return (
    <div className="dash-tile flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/70">
          <QrCode size={14} strokeWidth={2} aria-hidden="true" />
          Cupón QR
        </p>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            phase === 'qr'
              ? 'bg-dash-signal text-dash-forest'
              : phase === 'calculated'
                ? 'bg-dash-signal/15 text-dash-signal'
                : phase === 'weighing'
                  ? 'bg-dash-lime/10 text-dash-lime'
                  : 'bg-white/10 text-white/70'
          }`}
        >
          {stateLabel[phase]}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative w-[7.5rem] shrink-0 sm:w-36">
          <span className="dash-qr-corner -left-1 -top-1 rounded-tl border-l-2 border-t-2" aria-hidden="true" />
          <span className="dash-qr-corner -right-1 -top-1 rounded-tr border-r-2 border-t-2" aria-hidden="true" />
          <span className="dash-qr-corner -bottom-1 -left-1 rounded-bl border-b-2 border-l-2" aria-hidden="true" />
          <span className="dash-qr-corner -bottom-1 -right-1 rounded-br border-b-2 border-r-2" aria-hidden="true" />

          {issuedCoupon ? (
            <div className="dash-qr-frame">
              <div className="relative overflow-hidden rounded-[10px]">
                <QRCodeCanvas
                  value={issuedCoupon.payload}
                  size={256}
                  bgColor="#FFFFFF"
                  fgColor="#10201A"
                  level="M"
                  marginSize={1}
                  className="!block !h-auto !w-full"
                  role="img"
                  aria-label={`Código QR del cupón ${issuedCoupon.code}, ${formatPct(issuedCoupon.pct)} de descuento`}
                />
                <span className="dash-scanline" aria-hidden="true" />
              </div>
            </div>
          ) : (
            <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-[14px] border border-dashed border-white/25 bg-dash-forest2/60">
              {phase === 'weighing' && <span className="dash-shimmer absolute inset-0" aria-hidden="true" />}
              {phase === 'weighing' ? (
                <LoaderCircle
                  size={28}
                  strokeWidth={1.5}
                  className="text-dash-lime motion-safe:animate-spin"
                  aria-hidden="true"
                />
              ) : phase === 'calculated' ? (
                <Sparkles size={28} strokeWidth={1.5} className="text-dash-signal" aria-hidden="true" />
              ) : (
                <QrCode size={28} strokeWidth={1.4} className="text-white/45" aria-hidden="true" />
              )}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          {issuedCoupon ? (
            <>
              <p className="text-xs text-white/70">Código del cupón</p>
              <p className="mt-0.5 break-all font-mono text-base font-semibold tracking-[0.08em] text-dash-lime">
                {issuedCoupon.code}
              </p>
              <p className="mt-1.5 text-xs text-white/70">
                {formatPct(issuedCoupon.pct)} de descuento · válido hasta {issuedCoupon.expiresLabel}
              </p>
            </>
          ) : (
            <>
              <p className="text-sm leading-snug text-white/80">{placeholderCopy[placeholderPhase]}</p>
              <p className="mt-1.5 text-xs leading-snug text-white/65">
                Se escanea en cualquiera de los comercios aliados.
              </p>
            </>
          )}
        </div>
      </div>

      {issuedCoupon ? (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={copyCode}
            className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full bg-dash-signal px-3 text-sm font-bold text-dash-forest transition-colors hover:bg-dash-lime ${focusRing}`}
          >
            {copied ? (
              <Check size={15} strokeWidth={2.5} aria-hidden="true" />
            ) : (
              <Copy size={15} strokeWidth={2.2} aria-hidden="true" />
            )}
            {copied ? 'Copiado' : 'Copiar código'}
          </button>
          <button
            type="button"
            onClick={onReset}
            disabled={!canReset}
            className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-white/25 px-3 text-sm font-semibold text-white/85 transition-colors hover:border-white/45 hover:text-white disabled:cursor-not-allowed disabled:border-white/15 disabled:text-white/60 ${focusRing}`}
          >
            {canReset ? (
              <RotateCcw size={15} strokeWidth={2.2} aria-hidden="true" />
            ) : (
              <LoaderCircle size={15} strokeWidth={2.2} className="motion-safe:animate-spin" aria-hidden="true" />
            )}
            {canReset ? 'Nuevo pesaje' : 'Descargando…'}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onGenerate}
          disabled={!canGenerate}
          className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-dash-signal px-4 text-sm font-bold text-dash-forest transition-colors hover:bg-dash-lime disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/60 ${focusRing}`}
        >
          <QrCode size={16} strokeWidth={2.3} aria-hidden="true" />
          {buttonCopy}
        </button>
      )}

      <span className="sr-only" role="status" aria-live="polite">
        {copied ? 'Código copiado al portapapeles' : ''}
      </span>
    </div>
  )
}
