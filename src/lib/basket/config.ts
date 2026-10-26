/**
 * Single source of truth for the physical basket: hardware assumptions, STL part
 * transforms, sensor anchors, timings and the material catalogue.
 *
 * Units: millimetres, Y up. World origin sits on the floor under the basket centre.
 * Correct the numbers here if the real build differs from the assumptions.
 */
import type {
  CameraPreset,
  FlapHinge,
  MachineStateName,
  MaterialDef,
  MaterialId,
  PartId,
  SensorId,
  Vec3,
} from './types'

/** The 3D scene renders 1 unit = 10 cm, i.e. millimetres scaled by this factor. */
export const MM_TO_UNITS = 0.01

/* ------------------------------------------------------------------ */
/* Hardware                                                            */
/* ------------------------------------------------------------------ */

export const HARDWARE = {
  controller: 'ESP32 DevKit',
  loadCell: 'Celda de carga de barra 5 kg',
  adc: 'HX711 (24 bits, 10 SPS)',
  servo: 'Servo MG996R',
  presence: 'HC-SR04',
  fillSensor: 'VL53L0X (ToF)',
  display: 'LCD 1602 I²C',
} as const

export const LOAD_CELL = {
  /** Rated capacity; readings above it raise the overload flag. */
  maxKg: 5,
} as const

export const LCD_CONFIG = {
  /** Characters per row of the LCD 1602. */
  columns: 16,
  rows: 2,
} as const

export const HX711_CONFIG = {
  bits: 24,
  samplesPerSecond: 10,
  /** ~1 mV/V cell, 5 V excitation, gain 128 -> about 210 k counts for 1 kg. */
  countsPerKg: 209_715,
  /** Raw counts with an empty scale right after power-up. */
  defaultOffset: 84_523,
  /** RMS noise of a raw sample in counts (~0.4 g). */
  noiseCounts: 90,
  /** Slow thermal creep of the zero point, removed by the tare after every dump. */
  driftCountsPerS: 6,
  /** Samples kept for stability detection (1 s at 10 SPS). */
  windowSamples: 10,
  /** Standard deviation below which the reading counts as stable (5 g). */
  stableSigmaKg: 0.005,
  medianSize: 3,
  averageSize: 4,
  /** Readings below this are shown as exactly zero. */
  zeroDeadbandKg: 0.005,
  /** Tolerance above rated capacity before the overload flag trips. */
  overloadMarginKg: 0.025,
} as const

export const SERVO_CONFIG = {
  minUs: 500,
  maxUs: 2500,
  minDeg: 0,
  maxDeg: 180,
  closedDeg: 0,
  /** Flaps swing open (and the rocker releases them) at this angle. */
  openDeg: 85,
  /** Rated speed; 85 degrees take about 710 ms, visible but snappy. */
  speedDegPerS: 120,
} as const

export const PRESENCE_SENSOR = {
  /** Distance from the HC-SR04 to the closed flaps. */
  restCm: 10,
  /** Below this the machine considers that someone is depositing material. */
  thresholdCm: 8,
  /** Distance while an object is held at the mouth of the intake. */
  nearCm: 3.5,
  /** Distance to the item resting on the flaps. */
  loadedCm: 7,
  /** Distance to the pile / bin bottom while the flaps are open. */
  openCm: 24,
  noiseCm: 0.15,
  /** Far end of the range bar drawn in the telemetry card. */
  displayMaxCm: 30,
} as const

export const TOF_SENSOR = {
  minMm: 30,
  maxMm: 1200,
  noiseMm: 2.5,
} as const

/** Impact transient that rings on the load cell when material lands on the flaps. */
export const IMPACT = {
  amplitude: 0.5,
  tauS: 0.25,
  hz: 6,
} as const

export const WIFI = {
  baseDbm: -61,
  swingDb: 3,
  noiseDb: 0.8,
} as const

/* ------------------------------------------------------------------ */
/* Timings                                                             */
/* ------------------------------------------------------------------ */

export const TIMINGS = {
  sensorIntervalMs: 100,
  detectMs: 600,
  dropMs: 900,
  minWeighMs: 1200,
  qrHoldMs: 1800,
  openHoldMs: 1100,
  /** Litres per second the ToF-visible fill level follows the true fill. */
  fillAnimLitersPerS: 3,
  /** Machine time multiplier applied when the user prefers reduced motion. */
  reducedMotionScale: 2,
  /** Largest tick the hook feeds the reducer (protects against throttled tabs). */
  maxTickMs: 250,
} as const

export const LIMITS = {
  /** Smallest manual load the slider may place on the flaps. */
  minManualKg: 0.005,
  maxLogLines: 80,
  maxHistory: 100,
  /** Rendered item meshes in the 3D scene. */
  maxItems: 40,
} as const

/** Range of the random load placed by the "Lectura de prueba" button. */
export const TEST_LOAD = {
  minKg: 0.7,
  maxKg: 4.8,
} as const

/* ------------------------------------------------------------------ */
/* Bin geometry                                                        */
/* ------------------------------------------------------------------ */

export const BIN = {
  /** Inner dimensions taken from the STL (264 x 264 x 148 mm, about 10.3 L). */
  innerWidthMm: 264,
  innerDepthMm: 264,
  innerHeightMm: 148,
  /** World Y of the inner floor. */
  floorY: 4,
  fullThresholdPct: 90,
} as const

/** World position of the VL53L0X (ring inner back wall at z = -121, looking down). */
export const TOF_ANCHOR_Y_MM = 188
export const FILL_ANCHOR_Z_MM = -116

/* ------------------------------------------------------------------ */
/* Flaps (bomb-bay trapdoors)                                          */
/* ------------------------------------------------------------------ */

/**
 * 'walls': hinges at the outer edges (world z = +/-hingeZ), the inner edges meet at the centre and
 * swing down. 'center': hinge at z = 0, the outer edges drop.
 */
export const FLAP_HINGE: FlapHinge = 'walls'

export const FLAP = {
  lengthMm: 248,
  widthMm: 121,
  thicknessMm: 6.2,
  /** World Y of the flap top surface when closed. */
  topY: 150,
  /** Distance from the centre line to the hinge when FLAP_HINGE is 'walls'. */
  hingeZ: 122,
  openDeg: 85,
} as const

/**
 * The notches of the two closed flaps leave an open hole at the centre (x +/- halfXMm,
 * z +/- halfZMm). Deposited items must spawn and rest clear of it.
 */
export const FLAP_HOLE = {
  halfXMm: 28.5,
  halfZMm: 30,
} as const

/* ------------------------------------------------------------------ */
/* Servo / rocker assembly (left bracket)                              */
/* ------------------------------------------------------------------ */

/**
 * Positions are relative to SERVO_ASSEMBLY.shaft, the world point where the servo output shaft
 * crosses the rocker lug. The shaft axis is parallel to X (same as the flap hinges).
 */
export const SERVO_ASSEMBLY = {
  shaft: [-112, 188, 0] as Vec3,
  /** Servo body box: size (x, y, z) and centre relative to the shaft. */
  bodySize: [43, 20, 40] as Vec3,
  bodyCenter: [33, 0, 9] as Vec3,
  /** Output shaft cylinder (axis X). */
  shaftRadius: 2.5,
  shaftFromX: -4.5,
  shaftToX: 12,
  /** Horn adapter: STL thickness runs along local z, rotated so it runs along world X. */
  hornOffset: [0, -12.25, 5.75] as Vec3,
  hornRotation: [0, Math.PI / 2, 0] as Vec3,
  /** Rocker: lug pivot (STL local y, z) and where the STL origin lands relative to the shaft. */
  rockerPivotLocal: [0, 38, 30.4] as Vec3,
  rockerOffset: [-4.5, -38, -30.4] as Vec3,
  /** Rocker rotation about X per servo degree (negative swings the legs up and away). */
  rockerRatio: -1,
  /** Explode vector of the servo body prop. */
  bodyExplode: [40, 100, 0] as Vec3,
} as const

/* ------------------------------------------------------------------ */
/* Electronics box and lid                                             */
/* ------------------------------------------------------------------ */

/** White ring (STL bounding box): the brackets rise to `topY`. */
export const RING = { bottomY: 140, topY: 194.3 } as const

/** Black sleeve: its top rim carries a thin lip that sticks out of the front wall. */
export const SLEEVE = { bottomY: 154, rimY: 264, lipMm: 4, outerHalfMm: 140 } as const

export const ELECTRONICS = {
  /**
   * Box local z = 0 is its mounting face. The box sits just above the ring (bottom at y = 197,
   * 2.7 mm over the ring top) and is pushed out to z = 144 so it clears the sleeve's 4 mm lip.
   */
  boxPosition: [-42.5, 197, 144] as Vec3,
  /** The lid closes the open face at box z = 23. Windows face +z. */
  lidPosition: [-42.5, 197, 167] as Vec3,
  /** LCD module position inside the lid (local mm, lid origin = min corner). */
  lcd: { center: [42.5, 31.2] as readonly [number, number], size: [71, 24] as readonly [number, number] },
  oled: { center: [42.5, 65] as readonly [number, number], size: [24.5, 18] as readonly [number, number] },
  leds: [
    [27.6, 7.5],
    [60, 7.5],
  ] as readonly (readonly [number, number])[],
  ledRadius: 3.1,
} as const

/** Canvas colours of the LCD 1602, the status OLED and the status LEDs (3D textures). */
export const DISPLAY_COLORS = {
  lcd: {
    backlightFrom: '#2c6bff',
    backlightTo: '#1747c4',
    cell: 'rgba(8, 28, 110, 0.38)',
    glyph: '#f4f8ff',
  },
  oled: {
    background: '#04070b',
    border: 'rgba(125, 211, 252, 0.35)',
    primary: '#7dd3fc',
    secondary: 'rgba(125, 211, 252, 0.7)',
  },
} as const

/* ------------------------------------------------------------------ */
/* Parts                                                               */
/* ------------------------------------------------------------------ */

export const PART_COLORS = {
  black: { color: '#121212', roughness: 0.55, metalness: 0 },
  white: { color: '#F2F1EC', roughness: 0.5, metalness: 0 },
} as const

/** Off-the-shelf electronics drawn as simple props (no STL) and the status LED colours. */
export const PROP_COLORS = {
  aluminium: '#aeb4ba',
  bolt: '#2b2d30',
  ultrasonicBoard: '#1d5fa8',
  ultrasonicCan: '#b9bec4',
  tofBoard: '#5a2d91',
  tofLens: '#0d0d10',
  steel: '#8d9298',
} as const

export const LED_COLORS = {
  green: '#22c55e',
  amber: '#f59e0b',
  red: '#ef4444',
  off: '#1a1a1a',
} as const

/** Emissive tint of a hovered / selected printed part. */
export const HIGHLIGHT_COLOR = '#3ADD7F'

/**
 * Dark product stage: a green-black disc with a faint signal-green rim and glow, so the black
 * basket and the white ring both read against it.
 */
export const STAGE_COLORS = {
  disc: '#0b1712',
  rim: '#3ADD7F',
  rimOpacity: 0.5,
  /** `r, g, b` of the radial glow painted on the disc. */
  glowRgb: '58, 221, 127',
  glowAlpha: 0.16,
  contactShadow: '#050c08',
} as const

/** Procedural studio lighting (no HDR file is ever requested). */
export const STUDIO_COLORS = {
  backdrop: '#2a4a3c',
  top: '#ffffff',
  left: '#f3fff6',
  right: '#e8f8ff',
  front: '#ffffff',
  back: '#c8f36b',
} as const

/** Palettes of the procedural plastic items (picked per item seed). */
export const ITEM_COLORS = {
  pet: '#7fd9c8',
  hdpe: ['#f4f2ea', '#f0a24b', '#4a86d8', '#8c5ac2'],
  caps: ['#e5484d', '#3aa0ff', '#ffd23f', '#3add7f'],
  bags: ['#e6ece3', '#d7e6f2', '#f2e3d7', '#dbead9'],
} as const

/** Human label of each printed colour (Spanish UI copy). */
export const PART_COLOR_LABEL: Readonly<Record<keyof typeof PART_COLORS, string>> = {
  black: 'PLA negro',
  white: 'PLA blanco',
}

export type PartDef = {
  id: PartId
  url: string
  label: string
  /** Spanish description of what the part does. */
  description: string
  color: keyof typeof PART_COLORS
  /** Identical copies printed (the flaps come in pairs). Defaults to 1. */
  quantity?: number
  /** Bounding box of the STL in its own frame (x, y, z) in mm. */
  sizeMm: Vec3
  /** World position of the STL origin (mm). Unused for the flaps, see FLAP. */
  position: Vec3
  /** Euler XYZ in radians applied to the STL. */
  rotation: Vec3
  /** Displacement (mm) at full explosion. Flap z is mirrored per flap. */
  explode: Vec3
}

const MODEL_DIR = '/models/cesta'

export const PART_DEFS: readonly PartDef[] = [
  {
    id: 'cesta-inferior',
    url: `${MODEL_DIR}/cesta-inferior.stl`,
    label: 'Cesta inferior',
    description:
      'Depósito de acopio con fondo cerrado. Recibe el plástico que cae de las compuertas y aloja el sensor de nivel.',
    color: 'black',
    sizeMm: [272, 152, 272],
    position: [-136, 0, -136],
    rotation: [0, 0, 0],
    explode: [0, -120, 0],
  },
  {
    id: 'anillo-central',
    url: `${MODEL_DIR}/anillo-central.stl`,
    label: 'Anillo central',
    description:
      'Aro blanco que une la cesta superior con la inferior. Sus soportes internos sujetan el servo, la celda de carga y las compuertas.',
    color: 'white',
    sizeMm: [280, 54.3, 280],
    position: [-140, 140, -140],
    rotation: [0, 0, 0],
    explode: [0, 40, 0],
  },
  {
    id: 'cesta-superior',
    url: `${MODEL_DIR}/cesta-superior.stl`,
    label: 'Cesta superior',
    description:
      'Manga de ingreso sin fondo por donde se deposita el plástico. Guía el material hacia las compuertas y sostiene la caja electrónica.',
    color: 'black',
    sizeMm: [280, 110, 280],
    position: [-140, 140, -140],
    rotation: [0, 0, 0],
    explode: [0, 210, 0],
  },
  {
    id: 'bandeja',
    url: `${MODEL_DIR}/bandeja.stl`,
    label: 'Bandeja (compuerta)',
    description:
      'Dos compuertas idénticas que sostienen el material mientras la celda de carga lo pesa. Se abren hacia abajo, como una bodega de bombardero, para descargar.',
    color: 'black',
    quantity: 2,
    sizeMm: [248, 121, 6.2],
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    explode: [0, 70, 55],
  },
  {
    id: 'complemento-servo',
    url: `${MODEL_DIR}/complemento-servo.stl`,
    label: 'Adaptador del servo',
    description:
      'Adaptador de cuerno de 25 dientes para el servo MG996R. Transmite el giro del servo al brazo basculante.',
    color: 'black',
    sizeMm: [11.5, 24.5, 5],
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    explode: [-70, 110, 0],
  },
  {
    id: 'brazo-basculante',
    url: `${MODEL_DIR}/brazo-basculante.stl`,
    label: 'Brazo basculante',
    description:
      'Brazo en U que retiene las compuertas cerradas durante el pesaje y las libera cuando el servo gira.',
    color: 'black',
    sizeMm: [15, 48.5, 60.8],
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    explode: [-70, 30, 0],
  },
  {
    id: 'guarda-motor',
    url: `${MODEL_DIR}/guarda-motor.stl`,
    label: 'Guarda del motor',
    description:
      'Cubierta inclinada sobre el servo: desvía el material que cae para que no golpee ni atasque el motor.',
    color: 'black',
    sizeMm: [38.5, 54, 58],
    position: [-126, 180, -29],
    rotation: [0, 0, 0],
    explode: [-20, 170, 0],
  },
  {
    id: 'caja-electrica',
    url: `${MODEL_DIR}/caja-electrica.stl`,
    label: 'Caja eléctrica',
    description:
      'Caja exterior que aloja el ESP32 y el módulo HX711. Se atornilla a la pared frontal de la cesta superior.',
    color: 'black',
    sizeMm: [85, 81, 23],
    position: ELECTRONICS.boxPosition,
    rotation: [0, 0, 0],
    explode: [0, 120, 90],
  },
  {
    id: 'tapa-caja-electrica',
    url: `${MODEL_DIR}/tapa-caja-electrica.stl`,
    label: 'Tapa de la caja eléctrica',
    description:
      'Tapa con ventanas para la pantalla LCD 1602, el indicador OLED de 0,96" y los dos LED de estado.',
    color: 'black',
    sizeMm: [85, 81, 5.8],
    position: ELECTRONICS.lidPosition,
    rotation: [0, 0, 0],
    explode: [0, 120, 170],
  },
]

export const PART_BY_ID: Readonly<Record<PartId, PartDef>> = Object.fromEntries(
  PART_DEFS.map((part) => [part.id, part]),
) as Record<PartId, PartDef>

/* ------------------------------------------------------------------ */
/* Sensors                                                             */
/* ------------------------------------------------------------------ */

export type SensorAnchor = {
  id: SensorId
  label: string
  model: string
  /** World position (mm) of the pin in the assembled basket. */
  position: Vec3
}

/** Presence sensor body, looking down from the top inner front of the sleeve. */
export const PRESENCE_ANCHOR_MM: Vec3 = [0, 252, 122]

export const SENSOR_ANCHORS: readonly SensorAnchor[] = [
  { id: 'loadCell', label: 'Celda de carga', model: '5 kg + HX711', position: [111, 148, 0] },
  { id: 'presence', label: 'Presencia', model: 'HC-SR04', position: PRESENCE_ANCHOR_MM },
  { id: 'fill', label: 'Nivel de llenado', model: 'VL53L0X', position: [0, TOF_ANCHOR_Y_MM, FILL_ANCHOR_Z_MM] },
  { id: 'servo', label: 'Servo', model: 'MG996R', position: [-79, 188, 9] },
  { id: 'controller', label: 'Controlador', model: 'ESP32 + HX711', position: [0, 237.5, 170] },
]

/** Load cell bar prop on the right bracket. */
export const LOAD_CELL_PROP = {
  position: [111, 146, 0] as Vec3,
  size: [14, 12, 56] as Vec3,
}

/* ------------------------------------------------------------------ */
/* Cameras                                                             */
/* ------------------------------------------------------------------ */

/** Vertical field of view of the twin camera. */
export const CAMERA_FOV_DEG = 32

/** Extra room around the bounding sphere so the model never touches the canvas edge. */
export const CAMERA_FIT_MARGIN = 1.1

/**
 * Framing of each view. The camera looks at `target` from along `direction` (unit vector) and is
 * pulled back until the bounding sphere of radius `radiusMm` fits the canvas, both horizontally
 * and vertically, whatever its aspect ratio (see `framing.ts`).
 */
export type CameraPresetDef = {
  direction: Vec3
  target: Vec3
  /** Radius (mm) of a sphere around `target` that contains everything visible in this view. */
  radiusMm: number
  label: string
  /** Shorter label for narrow screens. */
  shortLabel: string
}

export const CAMERA_PRESETS: Readonly<Record<CameraPreset, CameraPresetDef>> = {
  iso: { direction: [0.618, 0.298, 0.728], target: [0, 140, 15], radiusMm: 255, label: 'Isométrica', shortLabel: 'Iso' },
  front: { direction: [0, 0.07, 0.998], target: [0, 140, 15], radiusMm: 225, label: 'Frontal', shortLabel: 'Frontal' },
  top: { direction: [0, 0.997, 0.07], target: [0, 120, 15], radiusMm: 225, label: 'Superior', shortLabel: 'Superior' },
  exploded: {
    direction: [0.553, 0.276, 0.786],
    target: [-10, 180, 100],
    radiusMm: 410,
    label: 'Explosionada',
    shortLabel: 'Explosión',
  },
}

export const CAMERA_PRESET_ORDER: readonly CameraPreset[] = ['iso', 'front', 'top', 'exploded']

/* ------------------------------------------------------------------ */
/* Materials                                                           */
/* ------------------------------------------------------------------ */

export const MATERIALS: readonly MaterialDef[] = [
  {
    id: 'pet',
    label: 'Botellas PET',
    description: 'Botellas de bebida aplastadas.',
    minKg: 1.2,
    maxKg: 2.6,
    litersPerKg: 1.8,
    itemsPerKg: 2.2,
    minItems: 2,
    maxItems: 6,
  },
  {
    id: 'hdpe',
    label: 'Envases HDPE',
    description: 'Envases de leche, detergente y aseo.',
    minKg: 0.9,
    maxKg: 2,
    litersPerKg: 2.2,
    itemsPerKg: 1.8,
    minItems: 1,
    maxItems: 4,
  },
  {
    id: 'tapas',
    label: 'Tapas plásticas',
    description: 'Tapas pequeñas de botellas y frascos.',
    minKg: 0.4,
    maxKg: 1.1,
    litersPerKg: 1.4,
    itemsPerKg: 10,
    minItems: 4,
    maxItems: 12,
  },
  {
    id: 'mixta',
    label: 'Bolsa mixta',
    description: 'Bolsa con plásticos variados.',
    minKg: 1,
    maxKg: 3,
    litersPerKg: 1.7,
    itemsPerKg: 2.5,
    minItems: 2,
    maxItems: 7,
  },
]

export const MATERIAL_BY_ID: Readonly<Record<MaterialId, MaterialDef>> = Object.fromEntries(
  MATERIALS.map((material) => [material.id, material]),
) as Record<MaterialId, MaterialDef>

/** Half extent (mm) of an item across the flaps (z axis); decides how far from the hole it spawns. */
export const ITEM_CLEARANCE_MM: Readonly<Record<MaterialId, number>> = {
  pet: 30,
  hdpe: 50,
  tapas: 14,
  mixta: 57,
}

/* ------------------------------------------------------------------ */
/* Copy                                                                */
/* ------------------------------------------------------------------ */

/** Position of the flaps as the servo card reports it. */
export const SERVO_GATE_LABEL: Readonly<Record<'closed' | 'moving' | 'open', string>> = {
  closed: 'Cerradas',
  moving: 'En movimiento',
  open: 'Abiertas',
}

export const PHASE_STEPS: readonly string[] = [
  'Detección',
  'Depósito',
  'Pesaje',
  'Cálculo',
  'Cupón',
  'Descarga',
]

export const MACHINE_STATE_LABEL: Readonly<Record<MachineStateName, string>> = {
  idle: 'Esperando material',
  detecting: 'Detectando…',
  dropping: 'Recibiendo material…',
  weighing: 'Pesando…',
  calculated: 'Descuento calculado',
  qr: 'QR generado',
  dumping: 'Descargando…',
  closing: 'Cerrando compuertas…',
  full: 'Cesta llena',
}

/** Replaces the `idle` explanation while the last coupon is still on screen. */
export const IDLE_WITH_COUPON_HELP =
  'El último cupón sigue disponible. Para otra entrega, elige un material y pulsa Depositar.'

/** One-sentence explanation shown under the machine state. */
export const MACHINE_STATE_HELP: Readonly<Record<MachineStateName, string>> = {
  idle: 'Las compuertas están cerradas y la galga en cero. Elige un material y pulsa Depositar.',
  detecting: 'El sensor de presencia detectó un objeto en la boca de la cesta.',
  dropping: 'El material cae sobre las compuertas cerradas.',
  weighing: 'La celda de carga se está estabilizando; la lectura se congela al quedar estable.',
  calculated: 'El peso es estable y el descuento ya está calculado. Genera el cupón QR.',
  qr: 'Cupón emitido. En unos segundos las compuertas se abren para descargar.',
  dumping: 'El servo abre las compuertas y el material cae a la cesta inferior.',
  closing: 'Las compuertas vuelven a cerrarse y la galga se pone a cero.',
  full: 'El nivel supera el 90 %. Vacía la cesta para seguir depositando.',
}
