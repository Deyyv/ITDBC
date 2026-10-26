import { describe, expect, it } from 'vitest'
import { formatDbm, formatLogTime, formatMinus, formatUptime } from './format'

describe('formatMinus', () => {
  it('swaps the hyphen for a real minus sign and leaves positives alone', () => {
    expect(formatMinus(-7)).toBe('−7')
    expect(formatMinus(12)).toBe('12')
    expect(formatMinus(0)).toBe('0')
  })
})

describe('formatDbm', () => {
  it('uses a real minus sign and rounds', () => {
    expect(formatDbm(-54)).toBe('−54 dBm')
    expect(formatDbm(-61.4)).toBe('−61 dBm')
  })
})

describe('formatUptime', () => {
  it('formats seconds as hh:mm:ss', () => {
    expect(formatUptime(4)).toBe('00:00:04')
    expect(formatUptime(3725)).toBe('01:02:05')
    expect(formatUptime(-3)).toBe('00:00:00')
  })
})

describe('formatLogTime', () => {
  it('formats uptime milliseconds as mm:ss.mmm', () => {
    expect(formatLogTime(4200)).toBe('00:04.200')
    expect(formatLogTime(247_350)).toBe('04:07.350')
    expect(formatLogTime(-5)).toBe('00:00.000')
  })
})
