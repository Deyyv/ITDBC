import { describe, expect, it } from 'vitest'
import { HARDWARE, PART_COLORS, PART_DEFS } from './config'
import { electronicRows, formatDimensionsMm, partRows } from './spec'

describe('formatDimensionsMm', () => {
  it('prints whole numbers plainly and decimals with a comma', () => {
    expect(formatDimensionsMm([272, 152, 272])).toBe('272 × 152 × 272 mm')
    expect(formatDimensionsMm([248, 121, 6.2])).toBe('248 × 121 × 6,2 mm')
  })
})

describe('partRows', () => {
  const rows = partRows()

  it('lists every printed part once', () => {
    expect(rows.map((row) => row.id)).toEqual(PART_DEFS.map((part) => part.id))
  })

  it('takes the swatch from the 3D material of the part', () => {
    const ring = rows.find((row) => row.id === 'anillo-central')
    const basket = rows.find((row) => row.id === 'cesta-inferior')
    expect(ring?.swatch).toBe(PART_COLORS.white.color)
    expect(ring?.materialLabel).toBe('PLA blanco')
    expect(basket?.swatch).toBe(PART_COLORS.black.color)
    expect(basket?.materialLabel).toBe('PLA negro')
  })

  it('shows the pair of flaps as two units', () => {
    expect(rows.find((row) => row.id === 'bandeja')?.quantity).toBe(2)
    expect(rows.find((row) => row.id === 'cesta-inferior')?.quantity).toBe(1)
  })

  it('gives every part a role and dimensions', () => {
    for (const row of rows) {
      expect(row.role.length).toBeGreaterThan(20)
      expect(row.dimensions).toMatch(/ mm$/)
    }
  })
})

describe('electronicRows', () => {
  const rows = electronicRows()

  it('covers every hardware constant exactly once', () => {
    const models = rows.map((row) => row.model)
    for (const model of Object.values(HARDWARE)) expect(models).toContain(model)
    expect(new Set(rows.map((row) => row.id)).size).toBe(rows.length)
  })

  it('derives the figures from the configuration', () => {
    const servo = rows.find((row) => row.id === 'servo')
    expect(servo?.detail).toContain('500 a 2500 µs')
    const fill = rows.find((row) => row.id === 'fill')
    expect(fill?.detail).toContain('90 %')
  })
})
