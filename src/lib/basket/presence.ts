/**
 * Reading of the HC-SR04 presence sensor at the mouth of the basket.
 */
import { PRESENCE_SENSOR } from './config'

/** True when something is closer than the detection threshold (strictly: the threshold itself is clear). */
export function isObjectDetected(
  distanceCm: number,
  thresholdCm: number = PRESENCE_SENSOR.thresholdCm,
): boolean {
  return distanceCm < thresholdCm
}
