import { Cog, Cpu, Radar, Ruler, Scale, TriangleAlert } from 'lucide-react'
import type { CSSProperties } from 'react'
import {
  BIN,
  DISPLAY_COLORS,
  HX711_CONFIG,
  LOAD_CELL,
  PRESENCE_SENSOR,
  SERVO_CONFIG,
  SERVO_GATE_LABEL,
} from '../../lib/basket/config'
import { isFull } from '../../lib/basket/fillLevel'
import { isObjectDetected } from '../../lib/basket/presence'
import { gateState } from '../../lib/basket/servo'
import type { SensorTrails } from '../../lib/basket/trails'
import { wifiQuality } from '../../lib/basket/trails'
import type { BasketTelemetry, LcdFrame } from '../../lib/basket/types'
import { formatCompactNumber, formatMinus, formatUptime } from '../../lib/format'
import { headroomMax } from '../../lib/sparkline'
import SensorCard, { Facts, Reading, StatusBadge } from './SensorCard'
import Sparkline from './Sparkline'

type TelemetryProps = { telemetry: BasketTelemetry }
type TrailProps = { trails: SensorTrails }

/* ------------------------------------------------------------------ */
/* Load cell · HX711                                                   */
/* ------------------------------------------------------------------ */

export function LoadCellCard({ telemetry, className }: TelemetryProps & { className?: string }) {
  const { hx711Kg, hx711Raw, sigmaG, stable, overload, history } = telemetry
  const top = headroomMax(history, 0.5)

  return (
    <SensorCard
      icon={Scale}
      title="Celda de carga"
      model="HX711 · 24 bits"
      className={className}
      status={
        overload ? (
          <StatusBadge tone="danger">Sobrecarga</StatusBadge>
        ) : stable ? (
          <StatusBadge tone="ok">Estable</StatusBadge>
        ) : (
          <StatusBadge tone="warn">Estabilizando</StatusBadge>
        )
      }
    >
      <div className="grid gap-5 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-end">
        <div>
          <Reading value={formatCompactNumber(hx711Kg, 3)} unit="kg" />
          <p className="mt-1.5 text-xs text-dash-muted">Peso filtrado (mediana + promedio)</p>
        </div>
        <div className="relative min-w-0">
          <Sparkline
            values={history}
            min={0}
            max={top}
            guides={[top / 2]}
            label={`Peso de los últimos ${history.length} muestreos, hasta ${formatCompactNumber(top, 2)} kilogramos`}
            className="h-24"
          />
          <span className="absolute left-0 top-0 -translate-y-1 text-xs tabular-nums text-dash-muted">
            {formatCompactNumber(top, 1)} kg
          </span>
          <span className="absolute bottom-0 left-0 translate-y-4 text-xs tabular-nums text-dash-muted">0</span>
        </div>
      </div>
      <Facts
        items={[
          { label: 'Lectura cruda', value: `${formatCompactNumber(hx711Raw, 0)} cuentas` },
          { label: 'Ruido σ (1 s)', value: `${formatCompactNumber(sigmaG, 1)} g` },
          { label: 'Muestreo', value: `${HX711_CONFIG.samplesPerSecond} SPS` },
          { label: 'Capacidad', value: `${LOAD_CELL.maxKg} kg` },
        ]}
      />
    </SensorCard>
  )
}

/* ------------------------------------------------------------------ */
/* Presence · HC-SR04                                                  */
/* ------------------------------------------------------------------ */

export function PresenceCard({ telemetry, trails }: TelemetryProps & TrailProps) {
  const { presenceCm } = telemetry
  const detected = isObjectDetected(presenceCm)
  const range = PRESENCE_SENSOR.displayMaxCm
  const marker = Math.min(100, Math.max(0, (presenceCm / range) * 100))
  const threshold = (PRESENCE_SENSOR.thresholdCm / range) * 100

  return (
    <SensorCard
      icon={Radar}
      title="Presencia"
      model="HC-SR04 · ultrasonido"
      status={
        detected ? (
          <StatusBadge tone="ok">Objeto detectado</StatusBadge>
        ) : (
          <StatusBadge tone="neutral">Sin objeto</StatusBadge>
        )
      }
    >
      <Reading value={formatCompactNumber(presenceCm, 1)} unit="cm" />

      <div>
        <div className="relative h-2 rounded-full bg-dash-cement">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-dash-signal/30"
            style={{ width: `${threshold}%` }}
            aria-hidden="true"
          />
          <span
            className="absolute -top-1 h-4 w-4 -translate-x-1/2 rounded-full border-2 border-white bg-dash-signalInk shadow-sm"
            style={{ left: `${marker}%` }}
            aria-hidden="true"
          />
        </div>
        <div className="mt-2 flex justify-between text-xs tabular-nums text-dash-muted" aria-hidden="true">
          <span>0</span>
          <span>Umbral {PRESENCE_SENSOR.thresholdCm} cm</span>
          <span>{range} cm</span>
        </div>
      </div>

      <Sparkline
        values={trails.presenceCm}
        min={0}
        max={range}
        guides={[PRESENCE_SENSOR.thresholdCm]}
        label="Distancia medida en los últimos segundos"
        className="h-10"
      />
    </SensorCard>
  )
}

/* ------------------------------------------------------------------ */
/* Fill level · VL53L0X                                                */
/* ------------------------------------------------------------------ */

export function FillLevelCard({ telemetry, trails }: TelemetryProps & TrailProps) {
  const { fillPct, tofMm } = telemetry
  const pct = Math.round(fillPct)
  const nearlyFull = isFull(fillPct)

  return (
    <SensorCard
      icon={Ruler}
      title="Nivel de llenado"
      model="VL53L0X · tiempo de vuelo"
      status={
        nearlyFull ? (
          <StatusBadge tone="warn">Llena</StatusBadge>
        ) : (
          <StatusBadge tone="ok">Con espacio</StatusBadge>
        )
      }
    >
      <Reading value={String(pct)} unit="% de la cesta" />

      <div
        role="progressbar"
        aria-label="Nivel de llenado de la cesta"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-valuetext={`${pct} por ciento${nearlyFull ? ', cesta llena' : ''}`}
      >
        <div className="relative h-3 overflow-hidden rounded-full bg-dash-cement" aria-hidden="true">
          <div
            className={`h-full rounded-full transition-[width] duration-300 ${
              nearlyFull ? 'bg-amber-500' : 'bg-dash-signalDeep'
            }`}
            style={{ width: `${Math.min(100, fillPct)}%` }}
          />
          <span
            className="absolute inset-y-0 w-0.5 bg-dash-ink/50"
            style={{ left: `${BIN.fullThresholdPct}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs tabular-nums text-dash-muted" aria-hidden="true">
          <span>0 %</span>
          <span>Aviso al {BIN.fullThresholdPct} %</span>
        </div>
      </div>

      {nearlyFull && (
        <p className="flex items-start gap-2 rounded-xl bg-amber-100 px-3 py-2 text-sm font-semibold leading-snug text-amber-900">
          <TriangleAlert size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          Casi llena: vacía la cesta para seguir depositando.
        </p>
      )}

      <Sparkline
        values={trails.fillPct}
        min={0}
        max={100}
        guides={[BIN.fullThresholdPct]}
        label="Nivel de llenado en los últimos segundos"
        className="h-10"
      />

      <Facts
        items={[
          { label: 'Distancia al material', value: `${formatCompactNumber(tofMm, 0)} mm` },
          { label: 'Aviso de llena', value: `≥ ${BIN.fullThresholdPct} %` },
        ]}
      />
    </SensorCard>
  )
}

/* ------------------------------------------------------------------ */
/* Servo · MG996R                                                      */
/* ------------------------------------------------------------------ */

const DIAL = { cx: 70, cy: 70, r: 56 }

const dialPoint = (servoDeg: number, radius: number) => {
  const theta = ((180 - servoDeg) * Math.PI) / 180
  return {
    x: Math.round((DIAL.cx + radius * Math.cos(theta)) * 100) / 100,
    y: Math.round((DIAL.cy - radius * Math.sin(theta)) * 100) / 100,
  }
}

function ServoDial({ angleDeg }: { angleDeg: number }) {
  const start = dialPoint(SERVO_CONFIG.minDeg, DIAL.r)
  const end = dialPoint(SERVO_CONFIG.maxDeg, DIAL.r)
  const open = dialPoint(SERVO_CONFIG.openDeg, DIAL.r)
  const openInner = dialPoint(SERVO_CONFIG.openDeg, DIAL.r - 12)
  const needle = dialPoint(angleDeg, DIAL.r - 6)
  const sweepEnd = dialPoint(Math.min(angleDeg, SERVO_CONFIG.maxDeg), DIAL.r)

  return (
    <svg
      viewBox="0 0 140 92"
      className="h-auto w-full min-w-[8rem] max-w-[9rem]"
      role="img"
      aria-label={`Ángulo del servo: ${formatCompactNumber(angleDeg, 0)} grados de ${SERVO_CONFIG.maxDeg}`}
    >
      <path
        d={`M${start.x} ${start.y} A${DIAL.r} ${DIAL.r} 0 0 1 ${end.x} ${end.y}`}
        fill="none"
        stroke="var(--dash-cement)"
        strokeWidth="10"
        strokeLinecap="round"
      />
      {angleDeg > 0.5 && (
        <path
          d={`M${start.x} ${start.y} A${DIAL.r} ${DIAL.r} 0 0 1 ${sweepEnd.x} ${sweepEnd.y}`}
          fill="none"
          stroke="var(--dash-signal-deep)"
          strokeWidth="10"
          strokeLinecap="round"
        />
      )}
      <line
        x1={openInner.x}
        y1={openInner.y}
        x2={open.x}
        y2={open.y}
        stroke="var(--dash-ink)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1={DIAL.cx}
        y1={DIAL.cy}
        x2={needle.x}
        y2={needle.y}
        stroke="var(--dash-ink)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx={DIAL.cx} cy={DIAL.cy} r="5" fill="var(--dash-ink)" />
      <text x={start.x} y="90" textAnchor="middle" fontSize="13" fill="var(--dash-muted)">
        0°
      </text>
      <text x={end.x} y="90" textAnchor="middle" fontSize="13" fill="var(--dash-muted)">
        {SERVO_CONFIG.maxDeg}°
      </text>
    </svg>
  )
}

export function ServoCard({ telemetry }: TelemetryProps) {
  const { servoDeg, servoUs } = telemetry
  const gate = gateState(servoDeg)

  return (
    <SensorCard
      icon={Cog}
      title="Servo"
      model="MG996R · compuertas"
      status={
        <StatusBadge tone={gate === 'moving' ? 'warn' : gate === 'open' ? 'ok' : 'neutral'}>
          {SERVO_GATE_LABEL[gate]}
        </StatusBadge>
      }
    >
      <div className="flex items-center justify-between gap-4">
        <Reading value={formatCompactNumber(servoDeg, 0)} unit="grados" />
        <ServoDial angleDeg={servoDeg} />
      </div>
      <Facts
        items={[
          { label: 'Pulso PWM', value: `${formatCompactNumber(servoUs, 0)} µs` },
          { label: 'Abre a', value: `${SERVO_CONFIG.openDeg}°` },
        ]}
      />
    </SensorCard>
  )
}

/* ------------------------------------------------------------------ */
/* Controller · ESP32                                                  */
/* ------------------------------------------------------------------ */

function SignalBars({ bars }: { bars: number }) {
  return (
    <span className="flex h-5 items-end gap-0.5" aria-hidden="true">
      {[1, 2, 3, 4].map((level) => (
        <span
          key={level}
          className={`w-1.5 rounded-sm ${level <= bars ? 'bg-dash-signalInk' : 'bg-dash-line-strong'}`}
          style={{ height: `${level * 25}%` }}
        />
      ))}
    </span>
  )
}

/** Same blue backlight and glyph colour as the LCD texture of the 3D model (single source: config). */
const LCD_STYLE: CSSProperties = {
  background: `linear-gradient(135deg, ${DISPLAY_COLORS.lcd.backlightFrom}, ${DISPLAY_COLORS.lcd.backlightTo})`,
  color: DISPLAY_COLORS.lcd.glyph,
}

export function ControllerCard({ telemetry, trails, lcd }: TelemetryProps & TrailProps & { lcd: LcdFrame }) {
  const { rssiDbm, uptimeS } = telemetry
  const quality = wifiQuality(rssiDbm)

  return (
    <SensorCard
      icon={Cpu}
      title="Controlador"
      model="ESP32 DevKit · Wi-Fi"
      status={<StatusBadge tone={quality.bars >= 2 ? 'ok' : 'warn'}>Wi-Fi conectado</StatusBadge>}
    >
      <div className="flex items-center justify-between gap-3">
        <Reading value={formatMinus(rssiDbm)} unit="dBm" />
        <div className="flex items-center gap-2">
          <SignalBars bars={quality.bars} />
          <span className="text-sm font-semibold text-dash-ink">{quality.label}</span>
        </div>
      </div>

      <Sparkline
        values={trails.rssiDbm}
        min={-90}
        max={-40}
        label="Intensidad de la señal Wi-Fi en los últimos segundos"
        className="h-10"
      />

      <div>
        <p className="text-xs text-dash-muted">Pantalla LCD 1602 (réplica)</p>
        <div
          className="lcd-screen mt-1.5 px-3 py-2 text-sm leading-snug"
          style={LCD_STYLE}
          role="img"
          aria-label={`Pantalla LCD: ${lcd.lines[0].trim()}. ${lcd.lines[1].trim()}`}
        >
          {lcd.lines[0].padEnd(16)}
          {'\n'}
          {lcd.lines[1].padEnd(16)}
        </div>
      </div>

      <Facts
        items={[
          { label: 'Tiempo activo', value: formatUptime(uptimeS) },
          { label: 'Lecturas', value: `${HX711_CONFIG.samplesPerSecond} por segundo` },
        ]}
      />
    </SensorCard>
  )
}
