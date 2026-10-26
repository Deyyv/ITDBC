import { describe, expect, it } from 'vitest'
import { stationAnnouncement, stationStatus } from './announce'
import { IDLE_WITH_COUPON_HELP, MACHINE_STATE_HELP, MACHINE_STATE_LABEL } from './config'
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
