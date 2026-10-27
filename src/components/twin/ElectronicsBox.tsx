import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import {
  CanvasTexture,
  Color,
  MeshBasicMaterial,
  MeshStandardMaterial,
  SRGBColorSpace,
} from 'three'
import { DISPLAY_COLORS, ELECTRONICS, LCD_CONFIG, LED_COLORS } from '../../lib/basket/config'
import type { LcdFrame, LedMode } from '../../lib/basket/types'

const LCD_PIXELS = { width: 592, height: 200 }
const OLED_PIXELS = { width: 272, height: 200 }
const LCD_FONT = 'bold 60px ui-monospace, "Courier New", monospace'

function useCanvasTexture(width: number, height: number) {
  const resources = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const texture = new CanvasTexture(canvas)
    texture.colorSpace = SRGBColorSpace
    texture.anisotropy = 4
    const material = new MeshBasicMaterial({ map: texture, toneMapped: false })
    return { canvas, texture, material }
  }, [width, height])

  useEffect(
    () => () => {
      resources.texture.dispose()
      resources.material.dispose()
    },
    [resources],
  )

  return resources
}

function drawLcd(canvas: HTMLCanvasElement, lines: readonly [string, string]) {
  const context = canvas.getContext('2d')
  if (!context) return
  const { width, height } = canvas

  const backlight = context.createLinearGradient(0, 0, width, height)
  backlight.addColorStop(0, DISPLAY_COLORS.lcd.backlightFrom)
  backlight.addColorStop(1, DISPLAY_COLORS.lcd.backlightTo)
  context.fillStyle = backlight
  context.fillRect(0, 0, width, height)

  const marginX = 28
  const marginY = 24
  const cellWidth = (width - marginX * 2) / LCD_CONFIG.columns
  const cellHeight = (height - marginY * 2) / LCD_CONFIG.rows

  lines.forEach((line, row) => {
    const text = line.padEnd(LCD_CONFIG.columns).slice(0, LCD_CONFIG.columns)
    for (let column = 0; column < LCD_CONFIG.columns; column += 1) {
      const x = marginX + column * cellWidth
      const y = marginY + row * cellHeight
      context.fillStyle = DISPLAY_COLORS.lcd.cell
      context.fillRect(x + 2, y + 3, cellWidth - 4, cellHeight - 6)

      const char = text[column]
      if (char !== ' ') {
        context.font = LCD_FONT
        context.textAlign = 'center'
        context.textBaseline = 'middle'
        context.fillStyle = DISPLAY_COLORS.lcd.glyph
        context.fillText(char, x + cellWidth / 2, y + cellHeight / 2 + 3)
      }
    }
  })
}

function drawOled(canvas: HTMLCanvasElement, lines: readonly [string, string]) {
  const context = canvas.getContext('2d')
  if (!context) return
  const { width, height } = canvas

  context.fillStyle = DISPLAY_COLORS.oled.background
  context.fillRect(0, 0, width, height)
  context.strokeStyle = DISPLAY_COLORS.oled.border
  context.lineWidth = 3
  context.strokeRect(6, 6, width - 12, height - 12)

  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillStyle = DISPLAY_COLORS.oled.primary
  context.font = 'bold 50px ui-monospace, "Courier New", monospace'
  context.fillText(lines[0], width / 2, height * 0.38, width - 28)
  context.fillStyle = DISPLAY_COLORS.oled.secondary
  context.font = '38px ui-monospace, "Courier New", monospace'
  context.fillText(lines[1], width / 2, height * 0.7, width - 28)
}

const LED_GREEN = new Color(LED_COLORS.green)
const LED_AMBER = new Color(LED_COLORS.amber)
const LED_RED = new Color(LED_COLORS.red)
const LED_OFF = new Color(LED_COLORS.off)

type LedProps = {
  index: 0 | 1
  mode: LedMode
  reducedMotion: boolean
}

/** Status LED seated in a lid hole: green = ready, amber = busy, both blink red when full. */
function StatusLed({ index, mode, reducedMotion }: LedProps) {
  const material = useMemo(
    () =>
      new MeshStandardMaterial({
        color: LED_OFF,
        emissive: LED_OFF,
        emissiveIntensity: 0,
        roughness: 0.3,
        toneMapped: false,
      }),
    [],
  )
  useEffect(() => () => material.dispose(), [material])

  useFrame(({ clock }) => {
    const own = index === 0 ? LED_GREEN : LED_AMBER
    const lit = mode === 'full' || (index === 0 ? mode === 'ready' : mode === 'busy')
    const tint = mode === 'full' ? LED_RED : own
    const blink =
      mode === 'full' && !reducedMotion ? (Math.sin(clock.elapsedTime * 2 * Math.PI * 2) > 0 ? 1 : 0.08) : 1
    const pulse = mode === 'busy' && !reducedMotion ? 0.75 + 0.25 * Math.sin(clock.elapsedTime * 7) : 1

    material.color.copy(lit ? tint : LED_OFF)
    material.emissive.copy(lit ? tint : LED_OFF)
    material.emissiveIntensity = lit ? 2.2 * blink * pulse : 0
  })

  const [x, y] = ELECTRONICS.leds[index]
  return (
    <mesh position={[x, y, 3.4]} material={material} raycast={() => null}>
      <sphereGeometry args={[ELECTRONICS.ledRadius, 18, 12]} />
    </mesh>
  )
}

type LidElectronicsProps = {
  lcd: LcdFrame
  reducedMotion: boolean
}

/**
 * LCD 1602, status OLED and the two LEDs, expressed in the lid's own frame (origin at its min
 * corner, windows facing +z). Render it as a child of the lid group.
 */
export default function LidElectronics({ lcd, reducedMotion }: LidElectronicsProps) {
  const lcdResources = useCanvasTexture(LCD_PIXELS.width, LCD_PIXELS.height)
  const oledResources = useCanvasTexture(OLED_PIXELS.width, OLED_PIXELS.height)

  const lcdKey = lcd.lines.join('\n')
  useEffect(() => {
    drawLcd(lcdResources.canvas, lcd.lines)
    lcdResources.texture.needsUpdate = true
  }, [lcdKey, lcdResources])

  const oledKey = lcd.oled.join('\n')
  useEffect(() => {
    drawOled(oledResources.canvas, lcd.oled)
    oledResources.texture.needsUpdate = true
  }, [oledKey, oledResources])

  const { lcd: lcdSlot, oled: oledSlot } = ELECTRONICS
  return (
    <group>
      <mesh
        position={[lcdSlot.center[0], lcdSlot.center[1], 1.2]}
        material={lcdResources.material}
        raycast={() => null}
      >
        <planeGeometry args={[lcdSlot.size[0], lcdSlot.size[1]]} />
      </mesh>
      <mesh
        position={[oledSlot.center[0], oledSlot.center[1], 1.2]}
        material={oledResources.material}
        raycast={() => null}
      >
        <planeGeometry args={[oledSlot.size[0], oledSlot.size[1]]} />
      </mesh>
      <StatusLed index={0} mode={lcd.led} reducedMotion={reducedMotion} />
      <StatusLed index={1} mode={lcd.led} reducedMotion={reducedMotion} />
    </group>
  )
}
