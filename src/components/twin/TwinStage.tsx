import {
  Component,
  Suspense,
  lazy,
  useEffect,
  useRef,
  useState,
  type ErrorInfo,
  type ReactNode,
} from 'react'
import type { BasketTwin } from '../../hooks/useBasketTwin'
import { twinAnnouncement, type TwinViewState } from '../../lib/basket/announce'
import { PART_DEFS } from '../../lib/basket/config'
import { activeStepIndex } from '../../lib/basket/machine'
import type { CameraPreset, MaterialId, PartId } from '../../lib/basket/types'
import {
  DepositControls,
  PartCard,
  PhaseStepper,
  StageHint,
  StageReadouts,
  ViewButtons,
  XrayToggle,
} from './TwinHud'

/** The whole 3D stack (three, fiber, drei, STL loaders) lives behind this dynamic import. */
const TwinCanvas = lazy(() => import('./TwinCanvas'))

function detectWebGl(): boolean {
  try {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('webgl2') ?? canvas.getContext('webgl')
    if (!context) return false
    context.getExtension('WEBGL_lose_context')?.loseContext()
    return true
  } catch {
    return false
  }
}

/** Placeholder with the outline of the basket while the 3D chunk and the STL files download. */
function Skeleton() {
  return (
    <div role="status" className="flex h-full w-full flex-col items-center justify-center gap-5 px-6">
      <svg
        viewBox="0 0 160 150"
        className="h-36 w-36 text-white/20 motion-safe:animate-pulse"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M30 20h100l-6 52H36z" />
        <path d="M24 72h112v22H24z" />
        <path d="M32 94l8 44h80l8-44" />
        <path d="M60 48h40" strokeLinecap="round" />
      </svg>
      <div className="text-center">
        <p className="text-sm font-semibold text-white/85">Cargando el gemelo digital…</p>
        <p className="mt-1 text-xs text-white/65">
          Descargando las {PART_DEFS.length} piezas del modelo 3D (menos de 1 MB).
        </p>
      </div>
    </div>
  )
}

function Unavailable({ reason }: { reason: 'webgl' | 'error' }) {
  return (
    <div
      role="alert"
      className="flex h-full w-full flex-col items-center justify-center gap-1.5 px-6 text-center"
    >
      <p className="text-sm font-semibold text-white">Vista 3D no disponible</p>
      <p className="max-w-[44ch] text-xs leading-snug text-white/75">
        {reason === 'webgl'
          ? 'Tu navegador o dispositivo no admite WebGL. El simulador sigue funcionando: usa los controles para depositar material y generar el cupón.'
          : 'No se pudo cargar el modelo 3D. Recarga la página para intentarlo de nuevo; el simulador sigue funcionando.'}
      </p>
    </div>
  )
}

type BoundaryProps = { fallback: ReactNode; children: ReactNode }

class TwinBoundary extends Component<BoundaryProps, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[twin] the 3D scene failed', error, info.componentStack)
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

type TwinStageProps = {
  twin: BasketTwin
}

/**
 * DOM wrapper of the digital twin: the canvas with a light HUD on top (phase stepper, view
 * buttons, readouts) and the deposit control bar below it, so nothing covers the model.
 */
export default function TwinStage({ twin }: TwinStageProps) {
  const [webGl] = useState(detectWebGl)
  const [view, setView] = useState<CameraPreset>('iso')
  const [xray, setXray] = useState(false)
  const [material, setMaterial] = useState<MaterialId>('pet')
  const [selectedPart, setSelectedPart] = useState<PartId | null>(null)
  const [ready, setReady] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const announced = useRef<TwinViewState>({ view, xray, selectedPartId: selectedPart })

  const { telemetry, machineState, reducedMotion } = twin
  const idleLike = machineState === 'idle' || machineState === 'full'

  // Announce only what the viewer changes on the twin; machine states have their own live region.
  useEffect(() => {
    const current: TwinViewState = { view, xray, selectedPartId: selectedPart }
    const text = twinAnnouncement(announced.current, current)
    announced.current = current
    if (text) setAnnouncement(text)
  }, [view, xray, selectedPart])

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div
        className="twin-viewport twin-backdrop relative isolate overflow-hidden rounded-2xl border border-white/10"
        role="group"
        aria-label="Gemelo digital 3D de la cesta"
      >
        <div className="absolute inset-0">
          {webGl ? (
            <TwinBoundary fallback={<Unavailable reason="error" />}>
              <Suspense fallback={null}>
                <TwinCanvas
                  telemetry={telemetry}
                  binFillPct={twin.binFillPct}
                  items={twin.items}
                  machineState={machineState}
                  lcd={twin.lcd}
                  view={view}
                  xray={xray}
                  autoRotate={idleLike && view === 'iso' && !reducedMotion}
                  reducedMotion={reducedMotion}
                  selectedPartId={selectedPart}
                  onSelectPart={setSelectedPart}
                  onReady={() => setReady(true)}
                />
              </Suspense>
              {/* Covers the blank canvas while the chunk, the STL files and the shaders load. */}
              {!ready && (
                <div className="twin-backdrop absolute inset-0 z-10">
                  <Skeleton />
                </div>
              )}
            </TwinBoundary>
          ) : (
            <Unavailable reason="webgl" />
          )}
        </div>

        <div className="pointer-events-none absolute inset-0 z-30 flex flex-col justify-between gap-2 p-2.5 sm:p-3">
          <div className="flex flex-wrap items-start gap-2">
            <PhaseStepper activeIndex={activeStepIndex(machineState)} />
            <div className="order-2 ml-auto sm:order-3 sm:ml-0">
              <XrayToggle xray={xray} onXrayChange={setXray} />
            </div>
            <div className="order-3 w-full sm:order-2 sm:ml-auto sm:w-auto">
              <ViewButtons view={view} onViewChange={setView} />
            </div>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-2">
            <StageReadouts telemetry={telemetry} />
            {selectedPart ? (
              <PartCard partId={selectedPart} onClose={() => setSelectedPart(null)} />
            ) : (
              <StageHint />
            )}
          </div>
        </div>
      </div>

      <DepositControls
        materials={twin.materials}
        material={material}
        onMaterialChange={setMaterial}
        canDeposit={twin.canDeposit}
        isFull={twin.isFull}
        canEmpty={twin.canEmpty}
        fillPct={twin.binFillPct}
        onDeposit={() => twin.deposit(material)}
        onEmpty={twin.emptyBin}
      />

      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
    </div>
  )
}
