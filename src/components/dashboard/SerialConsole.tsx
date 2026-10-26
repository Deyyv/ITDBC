import { memo, useEffect, useRef } from 'react'
import { Pause, Play } from 'lucide-react'
import { useSerialFeed } from '../../hooks/useSerialFeed'
import { formatLogTime } from '../../lib/format'
import type { LogLine, LogTag } from '../../lib/basket/types'

/** Visible keyboard focus on the near-black console surface. */
const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dash-lime focus-visible:ring-offset-2 focus-visible:ring-offset-dash-console'

const TAG_CLASS: Record<LogTag, string> = {
  ESP32: 'text-log-esp32',
  HX711: 'text-log-hx711',
  SERVO: 'text-log-servo',
  PRESENCE: 'text-log-presence',
  VL53L0X: 'text-log-tof',
  CUPON: 'text-log-cupon',
}

type SerialConsoleProps = {
  log: readonly LogLine[]
}

/**
 * Serial monitor of the ESP32. It follows the newest line until paused; it is deliberately not a
 * live region (the station announces its own changes), so screen readers are not flooded.
 */
function SerialConsole({ log }: SerialConsoleProps) {
  const { lines, paused, pending, toggle } = useSerialFeed(log)
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const body = bodyRef.current
    if (body && !paused) body.scrollTop = body.scrollHeight
  }, [lines, paused])

  return (
    <section className="dash-console overflow-hidden" aria-labelledby="console-title">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
        <div>
          <h3 id="console-title" className="font-sans text-base font-bold text-white">
            Monitor serie
          </h3>
          <p className="mt-0.5 text-xs text-white/65">ESP32 · 115200 baudios · últimas {lines.length} líneas</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-white/80">
            <span
              className={`h-2 w-2 rounded-full ${paused ? 'bg-amber-400' : 'bg-dash-signal motion-safe:animate-pulse'}`}
              aria-hidden="true"
            />
            {paused ? (pending > 0 ? `En pausa · ${pending} nuevas` : 'En pausa') : 'En vivo'}
          </span>
          <button
            type="button"
            onClick={toggle}
            aria-pressed={paused}
            className={`inline-flex min-h-10 items-center gap-2 rounded-full border border-white/25 px-4 text-sm font-semibold text-white/90 transition-colors hover:border-white/50 hover:text-white ${focusRing}`}
          >
            {paused ? (
              <Play size={14} strokeWidth={2.4} aria-hidden="true" />
            ) : (
              <Pause size={14} strokeWidth={2.4} aria-hidden="true" />
            )}
            {paused ? 'Reanudar' : 'Pausar'}
          </button>
        </div>
      </header>

      <div
        ref={bodyRef}
        role="log"
        aria-live="off"
        aria-label="Salida del monitor serie del ESP32"
        tabIndex={0}
        className="dash-console-body px-4 py-3 font-mono text-xs leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-dash-lime sm:px-5"
      >
        <ol>
          {lines.map((line) => (
            <li key={line.id} className="flex gap-3 py-0.5">
              <span className="shrink-0 tabular-nums text-white/60">{formatLogTime(line.t)}</span>
              <span className={`w-[4.75rem] shrink-0 font-semibold ${TAG_CLASS[line.tag]}`}>{line.tag}</span>
              <span className="min-w-0 break-words text-dash-consoleText">{line.message}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

export default memo(SerialConsole)
