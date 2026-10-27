import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export type BadgeTone = 'ok' | 'warn' | 'danger' | 'neutral'

const BADGE_CLASS: Record<BadgeTone, string> = {
  ok: 'bg-dash-signal/15 text-dash-signalInk',
  warn: 'bg-amber-100 text-amber-900',
  danger: 'bg-red-100 text-red-800',
  neutral: 'bg-dash-cement text-dash-muted',
}

/** Small state pill; the text always says the state, colour only reinforces it. */
export function StatusBadge({ tone, children }: { tone: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${BADGE_CLASS[tone]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {children}
    </span>
  )
}

type SensorCardProps = {
  icon: LucideIcon
  title: string
  /** Part number of the sensor. */
  model: string
  status?: ReactNode
  className?: string
  children: ReactNode
}

/** Shell shared by the live sensor cards: icon, name, part number and state on top. */
export default function SensorCard({ icon: Icon, title, model, status, className = '', children }: SensorCardProps) {
  return (
    <article className={`dash-panel flex flex-col gap-4 p-5 ${className}`}>
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-dash-forest text-dash-signal">
            <Icon size={19} strokeWidth={1.9} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h3 className="font-sans text-base font-bold leading-tight text-dash-ink">{title}</h3>
            <p className="mt-0.5 text-xs text-dash-muted">{model}</p>
          </div>
        </div>
        {status}
      </header>
      {children}
    </article>
  )
}

/** Big live number with its unit. */
export function Reading({ value, unit }: { value: string; unit: string }) {
  return (
    <p className="flex items-baseline gap-1.5">
      <span className="font-disp text-[2.5rem] font-medium leading-none tracking-[-0.03em] tabular-nums text-dash-ink">
        {value}
      </span>
      <span className="text-sm font-semibold text-dash-muted">{unit}</span>
    </p>
  )
}

/** Label / value pairs under a reading. */
export function Facts({ items }: { items: readonly { label: string; value: string }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 border-t border-dash-line pt-3.5">
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <dt className="text-xs text-dash-muted">{item.label}</dt>
          <dd className="mt-0.5 font-mono text-[0.8125rem] font-medium tabular-nums text-dash-ink">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}
