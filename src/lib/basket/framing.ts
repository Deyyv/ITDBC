/**
 * Camera framing: how far back the camera must sit so a bounding sphere fits the canvas
 * whatever its aspect ratio. Pure maths, millimetres in and out.
 */
import { CAMERA_FIT_MARGIN } from './config'
import type { Vec3 } from './types'

const DEG_TO_RAD = Math.PI / 180
const MIN_ASPECT = 0.2

export type FitInput = {
  /** Radius of the bounding sphere (mm). */
  radiusMm: number
  /** Vertical field of view in degrees. */
  fovDeg: number
  /** Canvas width / height. */
  aspect: number
  /** Multiplier on the radius; 1 makes the sphere touch the limiting canvas edge. */
  margin?: number
}

/** Half of the vertical and horizontal field of view, in radians. */
export function halfFovs(fovDeg: number, aspect: number): { vertical: number; horizontal: number } {
  const vertical = (fovDeg * DEG_TO_RAD) / 2
  const horizontal = Math.atan(Math.tan(vertical) * Math.max(aspect, MIN_ASPECT))
  return { vertical, horizontal }
}

/**
 * Distance from the camera to the sphere centre at which the sphere is tangent to the narrower of
 * the vertical and horizontal view cones (so a portrait canvas pulls the camera back further).
 */
export function fitDistanceMm({
  radiusMm,
  fovDeg,
  aspect,
  margin = CAMERA_FIT_MARGIN,
}: FitInput): number {
  const { vertical, horizontal } = halfFovs(fovDeg, aspect)
  return (radiusMm * margin) / Math.sin(Math.min(vertical, horizontal))
}

export type Framing = {
  direction: Vec3
  target: Vec3
  radiusMm: number
}

const normalize = (vector: Vec3): Vec3 => {
  const length = Math.hypot(vector[0], vector[1], vector[2]) || 1
  return [vector[0] / length, vector[1] / length, vector[2] / length]
}

/** Camera position (mm) that frames the whole sphere of `framing` from its view direction. */
export function framedPosition(
  framing: Framing,
  fovDeg: number,
  aspect: number,
  margin: number = CAMERA_FIT_MARGIN,
): Vec3 {
  const distance = fitDistanceMm({ radiusMm: framing.radiusMm, fovDeg, aspect, margin })
  const direction = normalize(framing.direction)
  return [
    framing.target[0] + direction[0] * distance,
    framing.target[1] + direction[1] * distance,
    framing.target[2] + direction[2] * distance,
  ]
}
