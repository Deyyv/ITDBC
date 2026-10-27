import { ContactShadows, Environment, Lightformer, OrbitControls } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ElementRef,
  type MutableRefObject,
} from 'react'
import {
  AdditiveBlending,
  BackSide,
  CanvasTexture,
  PerspectiveCamera,
  SRGBColorSpace,
  Vector3,
} from 'three'
import {
  CAMERA_FOV_DEG,
  CAMERA_PRESETS,
  MM_TO_UNITS,
  STAGE_COLORS,
  STUDIO_COLORS,
} from '../../lib/basket/config'
import { fitDistanceMm, framedPosition } from '../../lib/basket/framing'
import type { CameraPreset, Vec3 } from '../../lib/basket/types'
import BasketModel from './BasketModel'
import DepositedItems from './DepositedItems'
import SensorHotspots from './SensorHotspots'
import type { TwinSceneProps } from './types'

type ControlsHandle = ElementRef<typeof OrbitControls>

type RigState = {
  /** The camera is gliding towards its goal. */
  active: boolean
  elapsed: number
  /** Place the camera on its goal at the next frame (first fit, no visible swoop). */
  snap: boolean
}

const scaled = (vector: Vec3): [number, number, number] => [
  vector[0] * MM_TO_UNITS,
  vector[1] * MM_TO_UNITS,
  vector[2] * MM_TO_UNITS,
]

/** Only used until the first resize measurement; the rig refits as soon as the canvas has a size. */
const FIRST_ASPECT = 1.4
const INITIAL_POSITION = scaled(framedPosition(CAMERA_PRESETS.iso, CAMERA_FOV_DEG, FIRST_ASPECT))
const INITIAL_TARGET = scaled(CAMERA_PRESETS.iso.target)

/**
 * Fits the preset's bounding sphere to the canvas (both axes, any aspect) and glides there. On
 * resize it refits; if the user already turned the model it keeps their angle and only changes
 * the distance.
 */
function CameraRig({
  view,
  controlsRef,
  rig,
  reducedMotion,
}: {
  view: CameraPreset
  controlsRef: MutableRefObject<ControlsHandle | null>
  rig: MutableRefObject<RigState>
  reducedMotion: boolean
}) {
  const camera = useThree((state) => state.camera)
  const size = useThree((state) => state.size)
  const goal = useMemo(() => ({ position: new Vector3(), target: new Vector3() }), [])
  const lastView = useRef<CameraPreset | null>(null)

  const aspect = size.width / Math.max(size.height, 1)
  const fov = camera instanceof PerspectiveCamera ? camera.fov : CAMERA_FOV_DEG

  useEffect(() => {
    const preset = CAMERA_PRESETS[view]
    const viewChanged = lastView.current !== view
    lastView.current = view

    goal.target.set(...scaled(preset.target))
    const controls = controlsRef.current
    if (!viewChanged && !rig.current.snap && controls) {
      // Resize: keep the angle the model is being looked at from, only refit the distance.
      const distance = fitDistanceMm({ radiusMm: preset.radiusMm, fovDeg: fov, aspect }) * MM_TO_UNITS
      goal.position.copy(camera.position).sub(controls.target).setLength(distance).add(goal.target)
    } else {
      goal.position.set(...scaled(framedPosition(preset, fov, aspect)))
    }
    rig.current = { active: true, elapsed: 0, snap: rig.current.snap }
  }, [view, aspect, fov, camera, goal, controlsRef, rig])

  useFrame((_, delta) => {
    const controls = controlsRef.current
    const state = rig.current
    if (!controls || !state.active) return

    if (reducedMotion || state.snap) {
      camera.position.copy(goal.position)
      controls.target.copy(goal.target)
      controls.update()
      state.active = false
      state.snap = false
      return
    }

    const blend = 1 - Math.exp(-5 * Math.min(delta, 0.1))
    camera.position.lerp(goal.position, blend)
    controls.target.lerp(goal.target, blend)
    controls.update()

    state.elapsed += delta
    const arrived =
      camera.position.distanceTo(goal.position) < 0.02 &&
      controls.target.distanceTo(goal.target) < 0.02
    if (arrived || state.elapsed > 2.4) state.active = false
  })

  return null
}

/** Tells the DOM overlay when the first frames are on screen, i.e. shaders are compiled. */
function ReadySignal({ onReady }: { onReady: () => void }) {
  const frames = useRef(0)
  useFrame(() => {
    frames.current += 1
    if (frames.current === 3) onReady()
  })
  return null
}

const STAGE_RADIUS = 2.9

/** Radial pool of signal green painted on the disc; alpha only, blended additively. */
function makeGlowTexture(): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const context = canvas.getContext('2d')
  if (context) {
    const gradient = context.createRadialGradient(128, 128, 0, 128, 128, 128)
    gradient.addColorStop(0, `rgba(${STAGE_COLORS.glowRgb}, ${STAGE_COLORS.glowAlpha})`)
    gradient.addColorStop(0.55, `rgba(${STAGE_COLORS.glowRgb}, ${STAGE_COLORS.glowAlpha * 0.35})`)
    gradient.addColorStop(1, `rgba(${STAGE_COLORS.glowRgb}, 0)`)
    context.fillStyle = gradient
    context.fillRect(0, 0, 256, 256)
  }
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return texture
}

/** Dark product stage with a faint signal-green rim and glow, so black and white PLA both read. */
function Pedestal() {
  const glow = useMemo(makeGlowTexture, [])
  useEffect(() => () => glow.dispose(), [glow])

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.003, 0]} receiveShadow>
        <circleGeometry args={[STAGE_RADIUS, 96]} />
        <meshStandardMaterial color={STAGE_COLORS.disc} roughness={0.92} metalness={0} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.002, 0]} raycast={() => null}>
        <circleGeometry args={[STAGE_RADIUS, 96]} />
        <meshBasicMaterial
          map={glow}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.001, 0]} raycast={() => null}>
        <ringGeometry args={[STAGE_RADIUS, STAGE_RADIUS + 0.04, 128]} />
        <meshBasicMaterial
          color={STAGE_COLORS.rim}
          transparent
          opacity={STAGE_COLORS.rimOpacity}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}

/** Procedural studio: only Lightformers, so no HDR file or CDN is ever requested. */
function Studio() {
  return (
    <Environment resolution={256}>
      <mesh scale={60}>
        <sphereGeometry args={[1, 24, 16]} />
        <meshBasicMaterial color={STUDIO_COLORS.backdrop} side={BackSide} />
      </mesh>
      <Lightformer
        form="rect"
        intensity={3.2}
        color={STUDIO_COLORS.top}
        position={[0, 6, 0]}
        rotation-x={Math.PI / 2}
        scale={[12, 12, 1]}
      />
      <Lightformer
        form="rect"
        intensity={2.4}
        color={STUDIO_COLORS.left}
        position={[-6, 2.5, 3]}
        rotation-y={Math.PI / 2}
        scale={[8, 4, 1]}
      />
      <Lightformer
        form="rect"
        intensity={2}
        color={STUDIO_COLORS.right}
        position={[6, 3, -2]}
        rotation-y={-Math.PI / 2}
        scale={[8, 3, 1]}
      />
      <Lightformer
        form="rect"
        intensity={1.6}
        color={STUDIO_COLORS.front}
        position={[0, 3, 7]}
        rotation-y={Math.PI}
        scale={[10, 3, 1]}
      />
      <Lightformer
        form="ring"
        intensity={1.8}
        color={STUDIO_COLORS.back}
        position={[0, 1.6, -7]}
        scale={6}
      />
    </Environment>
  )
}

export default function TwinCanvas({
  telemetry,
  binFillPct,
  items,
  lcd,
  view,
  xray,
  autoRotate,
  reducedMotion,
  selectedPartId,
  onSelectPart,
  onReady,
}: TwinSceneProps) {
  const servoRef = useRef(0)
  const controlsRef = useRef<ControlsHandle | null>(null)
  const rig = useRef<RigState>({ active: true, elapsed: 0, snap: true })
  const [interacted, setInteracted] = useState(false)

  useEffect(() => setInteracted(false), [view])

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: INITIAL_POSITION, fov: CAMERA_FOV_DEG, near: 0.1, far: 120 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onPointerMissed={() => onSelectPart(null)}
    >
      <ambientLight intensity={0.2} />
      <directionalLight
        castShadow
        position={[4, 9, 6]}
        intensity={1.6}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-camera-near={0.5}
        shadow-camera-far={28}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
      />
      <Studio />
      <Pedestal />
      <ContactShadows
        position={[0, 0.002, 0]}
        opacity={0.7}
        scale={7}
        blur={2.2}
        far={3.2}
        resolution={512}
        color={STAGE_COLORS.contactShadow}
      />

      {/* No inner Suspense on purpose: while the STLs load, <Canvas> suspends the outer boundary. */}
      <BasketModel
        servoRef={servoRef}
        servoTargetDeg={telemetry.servoDeg}
        exploded={view === 'exploded'}
        xray={xray}
        selectedPartId={selectedPartId}
        onSelectPart={onSelectPart}
        lcd={lcd}
        reducedMotion={reducedMotion}
      />
      <DepositedItems
        items={items}
        fillPct={binFillPct}
        servoRef={servoRef}
        reducedMotion={reducedMotion}
      />

      <SensorHotspots telemetry={telemetry} visible={view !== 'exploded'} />
      <ReadySignal onReady={onReady} />

      <CameraRig view={view} controlsRef={controlsRef} rig={rig} reducedMotion={reducedMotion} />
      <OrbitControls
        ref={controlsRef}
        target={INITIAL_TARGET}
        enablePan={false}
        enableDamping={!reducedMotion}
        dampingFactor={0.08}
        minDistance={2.5}
        maxDistance={32}
        maxPolarAngle={Math.PI / 2 - 0.04}
        autoRotate={autoRotate && !interacted && !reducedMotion}
        autoRotateSpeed={0.7}
        onStart={() => {
          rig.current.active = false
          setInteracted(true)
        }}
      />
    </Canvas>
  )
}
