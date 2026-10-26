import { describe, expect, it } from 'vitest'
import { SERVO_CONFIG } from './config'
import {
  advanceServo,
  angleToPulseUs,
  commandServo,
  createServo,
  gateState,
  isServoSettled,
  pulseUsToAngle,
  servoAngle,
} from './servo'

describe('servo pulse mapping', () => {
  it('maps the MG996R range 500-2500 us to 0-180 degrees', () => {
    expect(angleToPulseUs(0)).toBe(500)
    expect(angleToPulseUs(90)).toBe(1500)
    expect(angleToPulseUs(180)).toBe(2500)
    expect(angleToPulseUs(SERVO_CONFIG.openDeg)).toBe(1444)
  })

  it('clamps out of range values', () => {
    expect(angleToPulseUs(-20)).toBe(500)
    expect(angleToPulseUs(400)).toBe(2500)
    expect(pulseUsToAngle(100)).toBe(0)
    expect(pulseUsToAngle(9999)).toBe(180)
  })

  it('round-trips angle and pulse', () => {
    for (const angle of [0, 12, 45, 85, 135, 180]) {
      expect(pulseUsToAngle(angleToPulseUs(angle))).toBeCloseTo(angle, 1)
    }
  })
})

describe('servo motion', () => {
  it('opens 85 degrees in roughly 700 ms and ends exactly on target', () => {
    let motion = commandServo(createServo(0), SERVO_CONFIG.openDeg)
    expect(motion.durationMs).toBeGreaterThan(600)
    expect(motion.durationMs).toBeLessThan(800)

    for (let elapsed = 0; elapsed < 1000; elapsed += 50) motion = advanceServo(motion, 50)
    expect(isServoSettled(motion)).toBe(true)
    expect(servoAngle(motion)).toBe(SERVO_CONFIG.openDeg)
  })

  it('moves monotonically with ease in and ease out', () => {
    let motion = commandServo(createServo(0), 85)
    const angles: number[] = [servoAngle(motion)]
    while (!isServoSettled(motion)) {
      motion = advanceServo(motion, 20)
      angles.push(servoAngle(motion))
    }
    for (let index = 1; index < angles.length; index += 1) {
      expect(angles[index]).toBeGreaterThanOrEqual(angles[index - 1])
    }
    const first = angles[1] - angles[0]
    const middle = angles[Math.floor(angles.length / 2) + 1] - angles[Math.floor(angles.length / 2)]
    expect(first).toBeLessThan(middle)
  })

  it('replans from the current angle when commanded mid-move', () => {
    let motion = commandServo(createServo(0), 85)
    motion = advanceServo(motion, motion.durationMs / 2)
    const midway = servoAngle(motion)
    expect(midway).toBeGreaterThan(0)
    expect(midway).toBeLessThan(85)

    const closing = commandServo(motion, 0)
    expect(closing.from).toBeCloseTo(midway, 9)
    expect(closing.durationMs).toBeLessThan(commandServo(createServo(0), 85).durationMs)
  })

  it('does not move when already at the target', () => {
    const motion = commandServo(createServo(0), 0)
    expect(motion.durationMs).toBe(0)
    expect(isServoSettled(motion)).toBe(true)
    expect(servoAngle(motion)).toBe(0)
  })
})

describe('gateState', () => {
  it('reports the flaps as closed, moving or open', () => {
    expect(gateState(0)).toBe('closed')
    expect(gateState(0.8)).toBe('closed')
    expect(gateState(40)).toBe('moving')
    expect(gateState(SERVO_CONFIG.openDeg)).toBe('open')
    expect(gateState(SERVO_CONFIG.openDeg - 0.5)).toBe('open')
  })
})
