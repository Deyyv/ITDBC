import type {
  BasketTelemetry,
  CameraPreset,
  DepositItem,
  LcdFrame,
  MachineStateName,
  PartId,
} from '../../lib/basket/types'

/** Everything the lazy 3D scene needs; the DOM stage builds this from `useBasketTwin`. */
export type TwinSceneProps = {
  telemetry: BasketTelemetry
  /** True bin fill (not the smoothed ToF value); the pile settles to this level. */
  binFillPct: number
  items: readonly DepositItem[]
  machineState: MachineStateName
  lcd: LcdFrame
  view: CameraPreset
  xray: boolean
  /** Slow idle rotation, already filtered for reduced motion by the caller. */
  autoRotate: boolean
  reducedMotion: boolean
  selectedPartId: PartId | null
  onSelectPart: (id: PartId | null) => void
  /** Called once the scene has rendered its first frames (models loaded, shaders compiled). */
  onReady: () => void
}
