import { describe, expect, it } from 'vitest'
import { headroomMax, sparklineArea, sparklinePath, sparklineY } from './sparkline'

const box = { width: 100, height: 40, min: 0, max: 4 }

describe('sparklineY', () => {
  it('maps the value range onto the box, top = max', () => {
    expect(sparklineY(0, box)).toBe(40)
    expect(sparklineY(4, box)).toBe(0)
    expect(sparklineY(2, box)).toBe(20)
  })

  it('clamps values outside the range', () => {
    expect(sparklineY(-3, box)).toBe(40)
    expect(sparklineY(99, box)).toBe(0)
  })

  it('falls back to the baseline for a degenerate range', () => {
    expect(sparklineY(1, { ...box, max: 0 })).toBe(40)
  })
})

describe('sparklinePath', () => {
  it('returns nothing without samples', () => {
    expect(sparklinePath([], box)).toBe('')
    expect(sparklineArea([], box)).toBe('')
  })

  it('spreads the samples evenly from edge to edge', () => {
    expect(sparklinePath([0, 2, 4], box)).toBe('M0 40 L50 20 L100 0')
  })

  it('draws a flat line for a single sample', () => {
    expect(sparklinePath([2], box)).toBe('M0 20 L100 20')
  })

  it('closes the area along the bottom edge', () => {
    expect(sparklineArea([0, 4], box)).toBe('M0 40 L100 0 L100 40 L0 40 Z')
  })
})

describe('headroomMax', () => {
  it('keeps a floor for flat data and headroom above the peak', () => {
    expect(headroomMax([0, 0, 0], 0.5)).toBe(0.5)
    expect(headroomMax([1, 2, 4], 0.5)).toBeCloseTo(4.6, 6)
    expect(headroomMax([], 0.5)).toBe(0.5)
  })
})
