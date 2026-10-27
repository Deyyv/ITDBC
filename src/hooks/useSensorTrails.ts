import { useEffect, useState } from 'react'
import { EMPTY_TRAILS, appendTrails, type SensorTrails } from '../lib/basket/trails'
import type { BasketTelemetry } from '../lib/basket/types'

/**
 * Rolling histories of the sensors the machine does not buffer itself. Each telemetry tick
 * (10 Hz) appends one sample; call it from the component that draws them so only that subtree
 * re-renders for the extra state update.
 */
export function useSensorTrails(telemetry: BasketTelemetry): SensorTrails {
  const [trails, setTrails] = useState<SensorTrails>(EMPTY_TRAILS)

  useEffect(() => {
    setTrails((previous) => appendTrails(previous, telemetry))
  }, [telemetry])

  return trails
}
