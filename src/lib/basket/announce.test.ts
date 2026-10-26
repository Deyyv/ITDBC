import { describe, expect, it } from 'vitest'
import { stationAnnouncement, stationStatus, twinAnnouncement, type TwinViewState } from './announce'
import {
  CAMERA_PRESET_ORDER,
  CAMERA_PRESETS,
  IDLE_WITH_COUPON_HELP,
  MACHINE_STATE_HELP,
  MACHINE_STATE_LABEL,
  PART_DEFS,
} from './config'
import type { MachineStateName } from './types'

const STATES: readonly MachineStateName[] = [
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

describe('stationAnnouncement', () => {
  it('has a non-empty sentence for every state', () => {
    for (const state of STATES) {
      const text = stationAnnouncement({ state, discountPct: 0, stableKg: 0, coupon: null })
      expect(text.length).toBeGreaterThan(10)
    }
  })

  it('reports the discount and the weight once calculated', () => {
    const text = stationAnnouncement({ state: 'calculated', discountPct: 11, stableKg: 1.9, coupon: null })
    expect(text).toContain('11 por ciento')
    expect(text).toContain('1,90 kg')
  })

  it('reads the coupon code when it is issued or still on screen', () => {
    const coupon = { code: 'RP-TEST42', pct: 11 }
    expect(stationAnnouncement({ state: 'qr', discountPct: 11, stableKg: 1.9, coupon })).toContain('RP-TEST42')
    expect(stationAnnouncement({ state: 'idle', discountPct: 11, stableKg: 1.9, coupon })).toContain('RP-TEST42')
  })
})

describe('twinAnnouncement', () => {
  const base: TwinViewState = { view: 'iso', xray: false, selectedPartId: null }

  it('stays silent when nothing the viewer controls has changed', () => {
    expect(twinAnnouncement(base, { ...base })).toBe('')
  })

  it('names each camera view', () => {
    for (const view of CAMERA_PRESET_ORDER) {
      if (view === 'iso') continue
      const text = twinAnnouncement(base, { ...base, view })
      expect(text.startsWith('Vista ')).toBe(true)
      expect(text.toLowerCase()).toContain(CAMERA_PRESETS[view].label.toLowerCase())
    }
    expect(twinAnnouncement(base, { ...base, view: 'front' })).toBe('Vista frontal.')
  })

  it('explains that the exploded view separates the parts', () => {
    const text = twinAnnouncement(base, { ...base, view: 'exploded' })
    expect(text).toContain('explosionada')
    expect(text).toContain('separadas')
  })

  it('reports X-ray turning on and off', () => {
    expect(twinAnnouncement(base, { ...base, xray: true })).toBe('Rayos X activados.')
    expect(twinAnnouncement({ ...base, xray: true }, base)).toBe('Rayos X desactivados.')
  })

  it('reads the name of the selected part for every part', () => {
    for (const part of PART_DEFS) {
      const text = twinAnnouncement(base, { ...base, selectedPartId: part.id })
      expect(text).toBe(`Pieza seleccionada: ${part.label}.`)
    }
  })

  it('reports when the part card is closed', () => {
    const selected: TwinViewState = { ...base, selectedPartId: 'bandeja' }
    expect(twinAnnouncement(selected, base)).toBe('Información de la pieza cerrada.')
  })

  it('combines several simultaneous changes in one sentence', () => {
    const text = twinAnnouncement(base, { view: 'top', xray: true, selectedPartId: 'bandeja' })
    expect(text).toBe('Vista superior. Rayos X activados. Pieza seleccionada: Bandeja (compuerta).')
  })

  it('never repeats machine-state wording', () => {
    const everything = CAMERA_PRESET_ORDER.map((view) =>
      twinAnnouncement(base, { view, xray: true, selectedPartId: 'cesta-inferior' }),
    ).join(' ')
    for (const label of Object.values(MACHINE_STATE_LABEL)) {
      expect(everything).not.toContain(label)
    }
  })
})

describe('stationStatus', () => {
  it('describes every state with its label and help text', () => {
    for (const state of STATES) {
      const status = stationStatus(state, false)
      expect(status.label).toBe(MACHINE_STATE_LABEL[state])
      expect(status.help).toBe(MACHINE_STATE_HELP[state])
      expect(status.state).toBe(state)
    }
  })

  it('keeps showing the issued coupon after the dump', () => {
    const status = stationStatus('idle', true)
    expect(status.state).toBe('qr')
    expect(status.label).toBe(MACHINE_STATE_LABEL.qr)
    expect(status.help).toBe(IDLE_WITH_COUPON_HELP)
  })

  it('does not hide a full bin behind an old coupon', () => {
    expect(stationStatus('full', true).state).toBe('full')
  })
})
