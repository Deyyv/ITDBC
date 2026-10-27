import { describe, expect, it } from 'vitest'
import { LCD_CONFIG } from './config'
import { formatLcd } from './lcd'
import type { MachineStateName } from './types'

const base = { weightKg: 2.35, discountPct: 14, hasCoupon: false, rssiDbm: -61 }

describe('formatLcd', () => {
  it('shows the weight and the QR confirmation like the 1602 module would', () => {
    const frame = formatLcd({ ...base, state: 'qr', hasCoupon: true })
    expect(frame.lines[0]).toBe('Peso:  2.35 kg')
    expect(frame.lines[1]).toBe('Desc: 14%  QR OK')
    expect(frame.led).toBe('busy')
  })

  it('keeps every row within 16 plain ASCII characters for all states', () => {
    const states: MachineStateName[] = [
      'idle',
      'detecting',
      'dropping',
      'weighing',
      'calculated',
      'qr',
      'dumping',
      'closing',
      'full',
    ]
    for (const state of states) {
      for (const hasCoupon of [false, true]) {
        const frame = formatLcd({ ...base, state, hasCoupon })
        for (const line of frame.lines) {
          expect(line.length).toBeLessThanOrEqual(LCD_CONFIG.columns)
          expect(line).toMatch(/^[\x20-\x7e]*$/)
        }
      }
    }
  })

  it('reports ready, busy and full on the status LEDs', () => {
    expect(formatLcd({ ...base, state: 'idle' }).led).toBe('ready')
    expect(formatLcd({ ...base, state: 'weighing' }).led).toBe('busy')
    expect(formatLcd({ ...base, state: 'full' }).led).toBe('full')
    expect(formatLcd({ ...base, state: 'full' }).lines[0]).toBe('CESTA LLENA')
  })

  it('prints the Wi-Fi level on the OLED', () => {
    expect(formatLcd({ ...base, state: 'idle' }).oled).toEqual(['LISTO', '-61 dBm'])
  })
})
