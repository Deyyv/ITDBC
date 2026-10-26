import { useCursor } from '@react-three/drei'
import { useFrame, useLoader, type ThreeEvent } from '@react-three/fiber'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from 'react'
import { BufferGeometry, Color, MathUtils, Matrix4, MeshStandardMaterial, type Group } from 'three'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import { toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import {
  ELECTRONICS,
  FLAP,
  FLAP_HINGE,
  HIGHLIGHT_COLOR,
  MM_TO_UNITS,
  PART_BY_ID,
  PART_COLORS,
  PART_DEFS,
  SERVO_ASSEMBLY,
} from '../../lib/basket/config'
import { flapAngleRad } from '../../lib/basket/itemPhysics'
import type { FlapHinge, LcdFrame, PartId, Vec3 } from '../../lib/basket/types'
import LidElectronics from './ElectronicsBox'
import { FillSensorProp, LoadCellProp, PresenceSensorProp, ServoShaftProp } from './SensorProps'

const CREASE_ANGLE = Math.PI / 6
const PART_URLS = PART_DEFS.map((part) => part.url)
const HIGHLIGHT = new Color(HIGHLIGHT_COLOR)

/** Parts that turn translucent in X-ray mode, with their target opacity. */
const XRAY_OPACITY: Partial<Record<PartId, number>> = {
  'cesta-superior': 0.2,
  'cesta-inferior': 0.2,
  'anillo-central': 0.4,
}

const tuple = (vector: Vec3): [number, number, number] => [vector[0], vector[1], vector[2]]

type PartHandlers = {
  onPointerOver: (event: ThreeEvent<PointerEvent>) => void
  onPointerOut: () => void
  onClick: (event: ThreeEvent<MouseEvent>) => void
}

type ModelContextValue = {
  geometries: Readonly<Record<PartId, BufferGeometry>>
  materials: Readonly<Record<PartId, MeshStandardMaterial>>
  explodeRef: MutableRefObject<number>
  servoRef: MutableRefObject<number>
  bind: (id: PartId) => PartHandlers
}

const ModelContext = createContext<ModelContextValue | null>(null)

function useModel(): ModelContextValue {
  const value = useContext(ModelContext)
  if (!value) throw new Error('Basket parts must render inside <BasketModel>')
  return value
}

/** Loads the nine STL parts and smooths the creases so rounded corners look round. */
function useBasketGeometries(): Readonly<Record<PartId, BufferGeometry>> {
  const loaded = useLoader(STLLoader, PART_URLS)
  return useMemo(() => {
    const geometries = {} as Record<PartId, BufferGeometry>
    PART_DEFS.forEach((part, index) => {
      geometries[part.id] = toCreasedNormals(loaded[index], CREASE_ANGLE)
    })
    return geometries
  }, [loaded])
}

function usePartMaterials(): Readonly<Record<PartId, MeshStandardMaterial>> {
  const materials = useMemo(() => {
    const created = {} as Record<PartId, MeshStandardMaterial>
    for (const part of PART_DEFS) {
      const { color, roughness, metalness } = PART_COLORS[part.color]
      created[part.id] = new MeshStandardMaterial({
        color,
        roughness,
        metalness,
        emissive: HIGHLIGHT,
        emissiveIntensity: 0,
      })
    }
    return created
  }, [])

  useEffect(
    () => () => {
      Object.values(materials).forEach((material) => material.dispose())
    },
    [materials],
  )
  return materials
}

/**
 * Re-expresses the flap STL in its hinge frame: hinge edge along the X axis at the origin, the
 * flap extending towards +z, its top face at y = 0, centred on x = 0. The hinge is the long edge
 * with the two holes (STL y = 121); the notched edge (STL y = 0) is the inner, meeting edge.
 */
function buildFlapGeometry(source: BufferGeometry): BufferGeometry {
  const geometry = source.clone()
  const rotate = new Matrix4().makeRotationX(-Math.PI / 2)
  const place = new Matrix4().makeTranslation(-FLAP.lengthMm / 2, -FLAP.thicknessMm, FLAP.widthMm)
  geometry.applyMatrix4(place.multiply(rotate))
  return geometry
}

type FlapLayout = {
  /** World z of the hinge axis. */
  pivotZ: number
  /** True when the flap must extend towards -z from its hinge. */
  flip: boolean
  /** Sign of the X rotation that swings the free edge down. */
  sign: 1 | -1
}

function flapLayout(hinge: FlapHinge, side: -1 | 1): FlapLayout {
  if (hinge === 'walls') {
    return side === -1
      ? { pivotZ: -FLAP.hingeZ, flip: false, sign: 1 }
      : { pivotZ: FLAP.hingeZ, flip: true, sign: -1 }
  }
  return side === -1
    ? { pivotZ: 0, flip: true, sign: -1 }
    : { pivotZ: 0, flip: false, sign: 1 }
}

/* ------------------------------------------------------------------ */
/* Building blocks                                                     */
/* ------------------------------------------------------------------ */

/** Moves its children along an explode vector (mm) following the shared explode factor. */
function ExplodeGroup({ explode, children }: { explode: Vec3; children: ReactNode }) {
  const { explodeRef } = useModel()
  const ref = useRef<Group>(null)

  useFrame(() => {
    const t = explodeRef.current
    ref.current?.position.set(explode[0] * t, explode[1] * t, explode[2] * t)
  })

  return <group ref={ref}>{children}</group>
}

function PartMesh({ id }: { id: PartId }) {
  const { geometries, materials, bind } = useModel()
  const definition = PART_BY_ID[id]
  return (
    <mesh
      geometry={geometries[id]}
      material={materials[id]}
      position={tuple(definition.position)}
      rotation={tuple(definition.rotation)}
      castShadow
      receiveShadow
      {...bind(id)}
    />
  )
}

/** A fixed STL part that takes part in the exploded view. Children use world coordinates. */
function StaticPart({ id, children }: { id: PartId; children?: ReactNode }) {
  return (
    <ExplodeGroup explode={PART_BY_ID[id].explode}>
      <PartMesh id={id} />
      {children}
    </ExplodeGroup>
  )
}

/** Group centred on the servo shaft that turns with the servo (axis parallel to X). */
function ServoRotor({ children }: { children: ReactNode }) {
  const { servoRef } = useModel()
  const ref = useRef<Group>(null)

  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.x = MathUtils.degToRad(servoRef.current * SERVO_ASSEMBLY.rockerRatio)
    }
  })

  return (
    <group ref={ref} position={tuple(SERVO_ASSEMBLY.shaft)}>
      {children}
    </group>
  )
}

function Flap({ side, geometry }: { side: -1 | 1; geometry: BufferGeometry }) {
  const { materials, bind, servoRef } = useModel()
  const layout = flapLayout(FLAP_HINGE, side)
  const pivot = useRef<Group>(null)
  const explode = PART_BY_ID.bandeja.explode

  useFrame(() => {
    if (!pivot.current) return
    pivot.current.rotation.x = layout.sign * flapAngleRad(servoRef.current)
  })

  return (
    <ExplodeGroup explode={[explode[0], explode[1], explode[2] * side]}>
      <group ref={pivot} position={[0, FLAP.topY, layout.pivotZ]}>
        <group rotation={[0, layout.flip ? Math.PI : 0, 0]}>
          <mesh
            geometry={geometry}
            material={materials.bandeja}
            castShadow
            receiveShadow
            {...bind('bandeja')}
          />
        </group>
      </group>
    </ExplodeGroup>
  )
}

function ServoBody() {
  const { materials, bind } = useModel()
  const [sx, sy, sz] = SERVO_ASSEMBLY.bodySize
  const shaft = SERVO_ASSEMBLY.shaft
  const center = SERVO_ASSEMBLY.bodyCenter
  return (
    <mesh
      material={materials['complemento-servo']}
      position={[shaft[0] + center[0], shaft[1] + center[1], shaft[2] + center[2]]}
      castShadow
      receiveShadow
      {...bind('complemento-servo')}
    >
      <boxGeometry args={[sx, sy, sz]} />
    </mesh>
  )
}

/* ------------------------------------------------------------------ */
/* Model                                                               */
/* ------------------------------------------------------------------ */

type BasketModelProps = {
  /** Smoothed servo angle written here every frame; shared with the items and the flaps. */
  servoRef: MutableRefObject<number>
  /** Servo angle reported by the firmware (10 Hz). */
  servoTargetDeg: number
  exploded: boolean
  xray: boolean
  selectedPartId: PartId | null
  onSelectPart: (id: PartId | null) => void
  lcd: LcdFrame
  reducedMotion: boolean
}

type PartFx = { glow: number; opacity: number }

export default function BasketModel({
  servoRef,
  servoTargetDeg,
  exploded,
  xray,
  selectedPartId,
  onSelectPart,
  lcd,
  reducedMotion,
}: BasketModelProps) {
  const geometries = useBasketGeometries()
  const materials = usePartMaterials()
  const explodeRef = useRef(0)
  const [hovered, setHovered] = useState<PartId | null>(null)
  const fx = useRef<Partial<Record<PartId, PartFx>>>({})

  useCursor(hovered !== null)

  const flapGeometry = useMemo(() => buildFlapGeometry(geometries.bandeja), [geometries])
  useEffect(() => () => flapGeometry.dispose(), [flapGeometry])

  const bind = useCallback(
    (id: PartId): PartHandlers => ({
      onPointerOver: (event) => {
        event.stopPropagation()
        setHovered(id)
      },
      onPointerOut: () => setHovered((current) => (current === id ? null : current)),
      onClick: (event) => {
        event.stopPropagation()
        onSelectPart(id)
      },
    }),
    [onSelectPart],
  )

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1)
    explodeRef.current = reducedMotion
      ? exploded
        ? 1
        : 0
      : MathUtils.damp(explodeRef.current, exploded ? 1 : 0, 4.5, dt)
    servoRef.current = reducedMotion
      ? servoTargetDeg
      : MathUtils.damp(servoRef.current, servoTargetDeg, 16, dt)

    for (const part of PART_DEFS) {
      const material = materials[part.id]
      const state = (fx.current[part.id] ??= { glow: 0, opacity: 1 })

      const glowGoal = selectedPartId === part.id ? 0.55 : hovered === part.id ? 0.3 : 0
      state.glow = MathUtils.damp(state.glow, glowGoal, 12, dt)
      material.emissiveIntensity = state.glow

      const opacityGoal = xray ? (XRAY_OPACITY[part.id] ?? 1) : 1
      state.opacity = reducedMotion ? opacityGoal : MathUtils.damp(state.opacity, opacityGoal, 8, dt)
      const translucent = state.opacity < 0.995
      if (material.transparent !== translucent) {
        material.transparent = translucent
        material.depthWrite = !translucent
        material.needsUpdate = true
      }
      material.opacity = translucent ? state.opacity : 1
    }
  })

  const context = useMemo<ModelContextValue>(
    () => ({ geometries, materials, explodeRef, servoRef, bind }),
    [geometries, materials, servoRef, bind],
  )

  const horn = PART_BY_ID['complemento-servo']
  const rocker = PART_BY_ID['brazo-basculante']

  return (
    <ModelContext.Provider value={context}>
      <group scale={MM_TO_UNITS}>
        <StaticPart id="cesta-inferior" />
        <StaticPart id="anillo-central">
          <LoadCellProp />
          <FillSensorProp />
        </StaticPart>
        <StaticPart id="cesta-superior">
          <PresenceSensorProp />
        </StaticPart>
        <StaticPart id="guarda-motor" />
        <StaticPart id="caja-electrica" />
        <StaticPart id="tapa-caja-electrica">
          <group position={tuple(ELECTRONICS.lidPosition)}>
            <LidElectronics lcd={lcd} reducedMotion={reducedMotion} />
          </group>
        </StaticPart>

        <Flap side={-1} geometry={flapGeometry} />
        <Flap side={1} geometry={flapGeometry} />

        <ExplodeGroup explode={horn.explode}>
          <ServoRotor>
            <mesh
              geometry={geometries['complemento-servo']}
              material={materials['complemento-servo']}
              position={tuple(SERVO_ASSEMBLY.hornOffset)}
              rotation={tuple(SERVO_ASSEMBLY.hornRotation)}
              castShadow
              {...context.bind('complemento-servo')}
            />
            <ServoShaftProp />
          </ServoRotor>
        </ExplodeGroup>

        <ExplodeGroup explode={SERVO_ASSEMBLY.bodyExplode}>
          <ServoBody />
        </ExplodeGroup>

        <ExplodeGroup explode={rocker.explode}>
          <ServoRotor>
            <mesh
              geometry={geometries['brazo-basculante']}
              material={materials['brazo-basculante']}
              position={tuple(SERVO_ASSEMBLY.rockerOffset)}
              castShadow
              receiveShadow
              {...context.bind('brazo-basculante')}
            />
          </ServoRotor>
        </ExplodeGroup>
      </group>
    </ModelContext.Provider>
  )
}
