/**
 * Tiny kinematic model for the deposited items: gravity, one or two damped bounces, no physics
 * engine. Bodies are mutated in place because the 3D scene advances them every frame.
 */
import { BIN, FLAP, FLAP_HOLE } from './config'
import { pileHeightMm } from './fillLevel'
import { mulberry32 } from './rng'
import type { FlapHinge, Vec3 } from './types'

/** Slowed-down gravity (mm/s^2) so the fall is readable on screen. */
export const GRAVITY_MM_S2 = 2200
export const SPAWN_Y_MM = 340
export const RESTITUTION = 0.32
export const MAX_BOUNCES = 2
const MIN_BOUNCE_SPEED = 90

/** Half extents (mm) of the area where the pile may form inside the bin. */
export const PILE_HALF_X = 95
export const PILE_HALF_Z = 80

export type Body = {
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  rx: number
  ry: number
  rz: number
  wx: number
  wy: number
  wz: number
  bounces: number
  resting: boolean
}

/** Half width (mm) of the strip in x where items spawn. */
const SPAWN_HALF_X = 35
/** Spare room (mm) kept between an item's edge and the hole / the sleeve wall. */
const SPAWN_SLACK_MM = 4
/** Fraction of an item's half extent allowed to overhang the hole or the wall. */
const SPAWN_OVERHANG = 0.6

/**
 * Range of |z| (mm) where an item with the given half extent across the flaps may spawn: past the
 * hole left by the flap notches and short of the sleeve wall.
 */
export function spawnZRange(clearanceMm: number): { min: number; max: number } {
  const overhang = clearanceMm * SPAWN_OVERHANG
  const min = FLAP_HOLE.halfZMm + overhang + SPAWN_SLACK_MM
  const max = Math.max(min, BIN.innerDepthMm / 2 - overhang - SPAWN_SLACK_MM)
  return { min, max }
}

/**
 * Spawns an item above one of the two flaps, clear of the central hole. `clearanceMm` is the
 * item's half extent across the flaps (see `ITEM_CLEARANCE_MM`).
 */
export function spawnBody(seed: number, clearanceMm = 30): Body {
  const rng = mulberry32(seed)
  const stagger = (seed % 5) * 55
  const { min, max } = spawnZRange(clearanceMm)
  const side = rng() < 0.5 ? -1 : 1
  return {
    x: (rng() - 0.5) * 2 * SPAWN_HALF_X,
    y: SPAWN_Y_MM + stagger,
    z: side * (min + rng() * (max - min)),
    vx: (rng() - 0.5) * 30,
    vy: 0,
    vz: (rng() - 0.5) * 12,
    rx: (rng() - 0.5) * 1.2,
    // Long items lie along x so they stay on their flap instead of bridging the hole.
    ry: (rng() < 0.5 ? 0 : Math.PI) + (rng() - 0.5) * 0.9,
    rz: (rng() - 0.5) * 1.2,
    wx: (rng() - 0.5) * 7,
    wy: (rng() - 0.5) * 7,
    wz: (rng() - 0.5) * 7,
    bounces: 0,
    resting: false,
  }
}

const wrapAngle = (angle: number) => angle - Math.round(angle / (2 * Math.PI)) * 2 * Math.PI

function settleTilt(body: Body, dtS: number) {
  const k = 1 - Math.exp(-10 * dtS)
  body.rx = wrapAngle(body.rx)
  body.rz = wrapAngle(body.rz)
  body.rx -= body.rx * k
  body.rz -= body.rz * k
}

/**
 * Advances one body by `dtS` seconds against a horizontal floor at `floorY`. If the floor moves
 * away (flaps opening) the body starts falling again.
 */
export function stepBody(body: Body, dtS: number, floorY: number): void {
  if (body.y > floorY + 0.5) body.resting = false

  if (body.resting) {
    body.y = floorY
    body.vx = 0
    body.vy = 0
    body.vz = 0
    body.wx = 0
    body.wy = 0
    body.wz = 0
    settleTilt(body, dtS)
    return
  }

  body.vy -= GRAVITY_MM_S2 * dtS
  body.x += body.vx * dtS
  body.y += body.vy * dtS
  body.z += body.vz * dtS
  body.rx += body.wx * dtS
  body.ry += body.wy * dtS
  body.rz += body.wz * dtS

  if (body.y <= floorY) {
    body.y = floorY
    if (body.vy < -MIN_BOUNCE_SPEED && body.bounces < MAX_BOUNCES) {
      body.vy = -body.vy * RESTITUTION
      body.vx *= 0.6
      body.vz *= 0.6
      body.wx *= 0.45
      body.wy *= 0.45
      body.wz *= 0.45
      body.bounces += 1
    } else {
      body.vy = 0
      body.vx = 0
      body.vz = 0
      body.resting = true
    }
  } else if (body.y - floorY < 40) {
    settleTilt(body, dtS * 0.6)
  }
}

/**
 * Resting place of the `index`-th item (oldest first) among `count` items in a pile whose top
 * sits at `pct` percent of the bin height. Older items sit lower, the mound narrows towards the
 * top, and all positions stay inside the bin footprint.
 */
export function pileTarget(
  index: number,
  count: number,
  pct: number,
  seed: number,
  itemRadiusMm = 32,
): Vec3 {
  const rng = mulberry32((seed ^ 0x9e3779b9) + index * 977)
  const order = count <= 1 ? 0.5 : (index + 0.5) / count
  const level = Math.min(1, Math.max(0, order * 0.8 + rng() * 0.2))

  const minY = BIN.floorY + itemRadiusMm
  const maxY = Math.max(minY, BIN.floorY + pileHeightMm(pct) - itemRadiusMm * 0.5)
  const y = minY + (maxY - minY) * level

  const reach = 1 - 0.4 * level
  const angle = rng() * Math.PI * 2
  const radius = Math.sqrt(rng())
  return [
    Math.cos(angle) * radius * PILE_HALF_X * reach,
    y,
    Math.sin(angle) * radius * PILE_HALF_Z * reach,
  ]
}

/**
 * Height of the upper face of an opening flap at world z, or null where no flap is below (past
 * the swinging edge, or when the flap hangs almost vertically). Used to let items ride the flap
 * down instead of falling through it.
 */
export function flapSurfaceY(z: number, thetaRad: number, hinge: FlapHinge): number | null {
  const cos = Math.cos(thetaRad)
  if (cos < 1e-3) return null
  const distance = Math.abs(z)

  if (hinge === 'walls') {
    const hingeZ = FLAP.hingeZ
    if (distance > hingeZ) return null
    const along = (hingeZ - distance) / cos
    return along <= FLAP.widthMm ? FLAP.topY - (hingeZ - distance) * Math.tan(thetaRad) : null
  }

  const along = distance / cos
  return along <= FLAP.widthMm ? FLAP.topY - distance * Math.tan(thetaRad) : null
}
