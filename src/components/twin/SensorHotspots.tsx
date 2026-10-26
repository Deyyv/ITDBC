import { Html } from '@react-three/drei'
import { MM_TO_UNITS, SENSOR_ANCHORS, type SensorAnchor } from '../../lib/basket/config'
import { formatKg } from '../../lib/format'
import type { BasketTelemetry, SensorId } from '../../lib/basket/types'

function readingFor(id: SensorId, telemetry: BasketTelemetry): string {
  switch (id) {
    case 'loadCell':
      return `${formatKg(telemetry.hx711Kg, 3)} · σ ${telemetry.sigmaG} g · ${telemetry.stable ? 'estable' : 'inestable'}`
    case 'presence':
      return `${telemetry.presenceCm} cm`
    case 'fill':
      return `${telemetry.tofMm} mm · llenado ${Math.round(telemetry.fillPct)} %`
    case 'servo':
      return `${telemetry.servoDeg}° · ${telemetry.servoUs} µs`
    case 'controller':
      return `${telemetry.rssiDbm} dBm · activo ${telemetry.uptimeS} s`
  }
}

type HotspotProps = {
  anchor: SensorAnchor
  telemetry: BasketTelemetry
}

function Hotspot({ anchor, telemetry }: HotspotProps) {
  const reading = readingFor(anchor.id, telemetry)
  const [x, y, z] = anchor.position

  return (
    <Html
      position={[x * MM_TO_UNITS, y * MM_TO_UNITS, z * MM_TO_UNITS]}
      center
      zIndexRange={[20, 0]}
    >
      <div className="group relative">
        <button
          type="button"
          aria-label={`${anchor.label} ${anchor.model}: ${reading}`}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-dash-signal/70 bg-dash-forest/80 shadow-[0_0_0_3px_rgba(58,221,127,0.15)] backdrop-blur-sm transition-transform hover:scale-110 focus-visible:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dash-lime"
        >
          <span className="h-2 w-2 rounded-full bg-dash-signal" aria-hidden="true" />
        </button>
        <div
          role="tooltip"
          className="pointer-events-none absolute left-1/2 top-full z-10 mt-1.5 w-max max-w-[220px] -translate-x-1/2 rounded-lg border border-white/15 bg-dash-forest/95 px-2.5 py-1.5 text-left opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
        >
          <p className="text-[11px] font-semibold leading-tight text-white">
            {anchor.label}
            <span className="ml-1 font-normal text-white/55">{anchor.model}</span>
          </p>
          <p className="mt-0.5 font-mono text-[11px] leading-tight text-dash-lime">{reading}</p>
        </div>
      </div>
    </Html>
  )
}

type SensorHotspotsProps = {
  telemetry: BasketTelemetry
  /** Pins are hidden in the exploded view, where the parts no longer sit at their anchors. */
  visible: boolean
}

export default function SensorHotspots({ telemetry, visible }: SensorHotspotsProps) {
  if (!visible) return null
  return (
    <>
      {SENSOR_ANCHORS.map((anchor) => (
        <Hotspot key={anchor.id} anchor={anchor} telemetry={telemetry} />
      ))}
    </>
  )
}
