import { describe, expect, it } from 'vitest'
import { PRESENCE_SENSOR } from './config'
import { isObjectDetected } from './presence'

describe('isObjectDetected', () => {
  it('sees an object held at the mouth of the basket', () => {
    expect(isObjectDetected(PRESENCE_SENSOR.nearCm)).toBe(true)
    expect(isObjectDetected(PRESENCE_SENSOR.loadedCm)).toBe(true)
  })

  it('ignores the empty rest distance and the open-flap distance', () => {
    expect(isObjectDetected(PRESENCE_SENSOR.restCm)).toBe(false)
    expect(isObjectDetected(PRESENCE_SENSOR.openCm)).toBe(false)
  })

  it('is strict at the threshold', () => {
    expect(isObjectDetected(PRESENCE_SENSOR.thresholdCm - 0.1)).toBe(true)
    expect(isObjectDetected(PRESENCE_SENSOR.thresholdCm)).toBe(false)
  })

  it('accepts another threshold', () => {
    expect(isObjectDetected(12, 15)).toBe(true)
    expect(isObjectDetected(12, 10)).toBe(false)
  })
})
