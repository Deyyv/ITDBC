import { useEffect, useMemo } from 'react'
import { MeshStandardMaterial } from 'three'
import {
  FILL_ANCHOR_Z_MM,
  LOAD_CELL_PROP,
  PRESENCE_ANCHOR_MM,
  PRESENCE_PROP,
  PROP_COLORS,
  SERVO_ASSEMBLY,
  TOF_ANCHOR_Y_MM,
  TOF_PROP,
} from '../../lib/basket/config'

/**
 * Simple stand-ins for the off-the-shelf electronics that have no STL: load cell bar, HC-SR04,
 * VL53L0X and the output shaft. Coordinates are millimetres in world space; none of them take
 * pointer events so clicks fall through to the printed parts behind.
 */

const noRaycast = () => null

function usePropMaterial(color: string, roughness: number, metalness: number) {
  const material = useMemo(
    () => new MeshStandardMaterial({ color, roughness, metalness }),
    [color, roughness, metalness],
  )
  useEffect(() => () => material.dispose(), [material])
  return material
}

export function LoadCellProp() {
  const aluminium = usePropMaterial(PROP_COLORS.aluminium, 0.35, 0.85)
  const bolt = usePropMaterial(PROP_COLORS.bolt, 0.5, 0.6)
  const [x, y, z] = LOAD_CELL_PROP.position
  const [sx, sy, sz] = LOAD_CELL_PROP.size
  const { boltRadius, boltHeight, boltInsetMm } = LOAD_CELL_PROP
  return (
    <group position={[x, y, z]}>
      <mesh material={aluminium} castShadow raycast={noRaycast}>
        <boxGeometry args={[sx, sy, sz]} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          material={bolt}
          position={[0, sy / 2 + boltHeight / 2, side * (sz / 2 - boltInsetMm)]}
          raycast={noRaycast}
        >
          <cylinderGeometry args={[boltRadius, boltRadius, boltHeight, 12]} />
        </mesh>
      ))}
    </group>
  )
}

/** HC-SR04 hanging under the top of the sleeve with both transducers looking down. */
export function PresenceSensorProp() {
  const board = usePropMaterial(PROP_COLORS.ultrasonicBoard, 0.55, 0.1)
  const can = usePropMaterial(PROP_COLORS.ultrasonicCan, 0.4, 0.85)
  const [x, y, z] = PRESENCE_ANCHOR_MM
  const { liftMm, boardSize, canOffsetsX, canDropMm, canRadius, canHeight } = PRESENCE_PROP
  return (
    <group position={[x, y + liftMm, z]}>
      <mesh material={board} raycast={noRaycast}>
        <boxGeometry args={[...boardSize]} />
      </mesh>
      {canOffsetsX.map((offset) => (
        <mesh key={offset} material={can} position={[offset, -canDropMm, 0]} raycast={noRaycast}>
          <cylinderGeometry args={[canRadius, canRadius, canHeight, 24]} />
        </mesh>
      ))}
    </group>
  )
}

/** VL53L0X on the ring's inner back wall, aperture looking down into the bin. */
export function FillSensorProp() {
  const board = usePropMaterial(PROP_COLORS.tofBoard, 0.5, 0.1)
  const lens = usePropMaterial(PROP_COLORS.tofLens, 0.25, 0.3)
  return (
    <group position={[0, TOF_ANCHOR_Y_MM, FILL_ANCHOR_Z_MM]}>
      <mesh material={board} raycast={noRaycast}>
        <boxGeometry args={[...TOF_PROP.boardSize]} />
      </mesh>
      <mesh material={lens} position={[0, -TOF_PROP.lensDropMm, 0]} raycast={noRaycast}>
        <boxGeometry args={[...TOF_PROP.lensSize]} />
      </mesh>
    </group>
  )
}

/** Output shaft of the servo (rotates with the horn). Axis along X. */
export function ServoShaftProp() {
  const steel = usePropMaterial(PROP_COLORS.steel, 0.35, 0.9)
  const { shaftFromX, shaftToX, shaftRadius } = SERVO_ASSEMBLY
  return (
    <mesh
      material={steel}
      position={[(shaftFromX + shaftToX) / 2, 0, 0]}
      rotation={[0, 0, Math.PI / 2]}
      raycast={noRaycast}
    >
      <cylinderGeometry args={[shaftRadius, shaftRadius, shaftToX - shaftFromX, 16]} />
    </mesh>
  )
}
