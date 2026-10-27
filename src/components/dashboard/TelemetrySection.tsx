import { useSensorTrails } from '../../hooks/useSensorTrails'
import type { BasketTelemetry, LcdFrame, LogLine } from '../../lib/basket/types'
import { ControllerCard, FillLevelCard, LoadCellCard, PresenceCard, ServoCard } from './SensorCards'
import SectionHeading from './SectionHeading'
import SerialConsole from './SerialConsole'

type TelemetrySectionProps = {
  telemetry: BasketTelemetry
  log: readonly LogLine[]
  lcd: LcdFrame
}

/** Live readings of every sensor of the basket, followed by the ESP32 serial monitor. */
export default function TelemetrySection({ telemetry, log, lcd }: TelemetrySectionProps) {
  const trails = useSensorTrails(telemetry)

  return (
    <section id="telemetria" className="dash-section" aria-labelledby="telemetry-title">
      <div className="dash-container">
        <SectionHeading id="telemetry-title" title="Telemetría en vivo">
          Lo que mide cada sensor mientras la estación trabaja, actualizado diez veces por segundo.
        </SectionHeading>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <LoadCellCard telemetry={telemetry} className="md:col-span-2" />
          <PresenceCard telemetry={telemetry} trails={trails} />
          <FillLevelCard telemetry={telemetry} trails={trails} />
          <ServoCard telemetry={telemetry} />
          <ControllerCard telemetry={telemetry} trails={trails} lcd={lcd} />
        </div>

        <div className="mt-4">
          <SerialConsole log={log} />
        </div>
      </div>
    </section>
  )
}
