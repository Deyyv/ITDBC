import { CheckCircle2, CircleDot, LoaderCircle, TriangleAlert } from 'lucide-react'
import type { StationStatus } from '../../lib/basket/announce'
import type { MachineStateName } from '../../lib/basket/types'

type Tone = 'idle' | 'busy' | 'ready' | 'done' | 'warn'

const TONE_LABEL: Record<Tone, string> = {
  idle: 'En espera',
  busy: 'En curso',
  ready: 'Listo',
  done: 'Completado',
  warn: 'Atención',
}

const TONE_CLASS: Record<Tone, string> = {
  idle: 'border-white/20 text-white/75',
  busy: 'border-dash-lime/40 bg-dash-lime/10 text-dash-lime',
  ready: 'border-dash-signal/40 bg-dash-signal/10 text-dash-signal',
  done: 'border-dash-signal bg-dash-signal text-dash-forest',
  warn: 'border-amber-300/50 bg-amber-300/10 text-amber-200',
}

const STATE_TONE: Record<MachineStateName, Tone> = {
  idle: 'idle',
  detecting: 'busy',
  dropping: 'busy',
  weighing: 'busy',
  calculated: 'ready',
  qr: 'done',
  dumping: 'busy',
  closing: 'busy',
  full: 'warn',
}

const SPINNING: readonly MachineStateName[] = ['detecting', 'dropping', 'weighing', 'dumping', 'closing']

type MachineStatusCardProps = {
  status: StationStatus
}

/** Current state of the station in big type, with a one-sentence explanation. */
export default function MachineStatusCard({ status }: MachineStatusCardProps) {
  const tone = STATE_TONE[status.state]
  const spinning = SPINNING.includes(status.state)
  const Icon =
    tone === 'done' ? CheckCircle2 : tone === 'warn' ? TriangleAlert : spinning ? LoaderCircle : CircleDot

  return (
    <div className="dash-tile p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-white/70">Estado de la estación</p>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors ${TONE_CLASS[tone]}`}
        >
          <Icon
            size={13}
            strokeWidth={2.4}
            className={spinning ? 'motion-safe:animate-spin' : undefined}
            aria-hidden="true"
          />
          {TONE_LABEL[tone]}
        </span>
      </div>
      <p className="mt-2 font-disp text-[1.75rem] font-medium leading-tight tracking-[-0.02em] text-white">
        {status.label}
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-white/75">{status.help}</p>
    </div>
  )
}
