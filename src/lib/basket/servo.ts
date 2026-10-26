/**
 * MG996R servo model: pulse width mapping and a time-based eased motion at a rated speed.
 */
import { SERVO_CONFIG } from './config'

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

export function angleToPulseUs(angleDeg: number): number {
  const { minUs, maxUs, minDeg, maxDeg } = SERVO_CONFIG
  const angle = clamp(angleDeg, minDeg, maxDeg)
  return Math.round(minUs + ((angle - minDeg) / (maxDeg - minDeg)) * (maxUs - minUs))
}

export function pulseUsToAngle(pulseUs: number): number {
  const { minUs, maxUs, minDeg, maxDeg } = SERVO_CONFIG
  const pulse = clamp(pulseUs, minUs, maxUs)
  return minDeg + ((pulse - minUs) / (maxUs - minUs)) * (maxDeg - minDeg)
}

export type GateState = 'closed' | 'moving' | 'open'

/** Where the flaps are for a given servo angle (within one degree of either end counts as there). */
export function gateState(angleDeg: number): GateState {
  if (angleDeg <= SERVO_CONFIG.closedDeg + 1) return 'closed'
  if (angleDeg >= SERVO_CONFIG.openDeg - 1) return 'open'
  return 'moving'
}

/** One planned move: starts at `from`, ends at `to` after `durationMs`. */
export type ServoMotion = {
  readonly from: number
  readonly to: number
  readonly elapsedMs: number
  readonly durationMs: number
}

export function createServo(angleDeg: number = SERVO_CONFIG.closedDeg): ServoMotion {
  return { from: angleDeg, to: angleDeg, elapsedMs: 0, durationMs: 0 }
}

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

export function servoAngle(motion: ServoMotion): number {
  if (motion.durationMs <= 0 || motion.elapsedMs >= motion.durationMs) return motion.to
  const progress = motion.elapsedMs / motion.durationMs
  return motion.from + (motion.to - motion.from) * easeInOutCubic(progress)
}

export function isServoSettled(motion: ServoMotion): boolean {
  return motion.elapsedMs >= motion.durationMs
}

/** Plans a move from wherever the horn is right now to `targetDeg`. */
export function commandServo(
  motion: ServoMotion,
  targetDeg: number,
  speedDegPerS: number = SERVO_CONFIG.speedDegPerS,
): ServoMotion {
  const from = servoAngle(motion)
  const to = clamp(targetDeg, SERVO_CONFIG.minDeg, SERVO_CONFIG.maxDeg)
  const durationMs = (Math.abs(to - from) / speedDegPerS) * 1000
  return { from, to, elapsedMs: 0, durationMs }
}

export function advanceServo(motion: ServoMotion, dtMs: number): ServoMotion {
  if (isServoSettled(motion)) return motion
  const elapsedMs = Math.min(motion.durationMs, motion.elapsedMs + dtMs)
  return { ...motion, elapsedMs }
}
