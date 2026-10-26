import { describe, expect, it } from 'vitest'
import { TREE_KG_FACTOR, goalProgressPct, treesSaved } from './impact'

describe('treesSaved', () => {
  it('scales with the recycled plastic and rounds to one decimal', () => {
    expect(treesSaved(0)).toBe(0)
    expect(treesSaved(18.4)).toBe(0.9)
    expect(treesSaved(100)).toBe(Math.round(100 * TREE_KG_FACTOR * 10) / 10)
  })

  it('never reports negative trees', () => {
    expect(treesSaved(-5)).toBe(0)
  })
})

describe('goalProgressPct', () => {
  it('is the rounded percentage of the goal reached', () => {
    expect(goalProgressPct(0, 150)).toBe(0)
    expect(goalProgressPct(18.4, 25)).toBe(74)
    expect(goalProgressPct(75, 150)).toBe(50)
  })

  it('stops at 100 once the goal is passed', () => {
    expect(goalProgressPct(200, 150)).toBe(100)
  })

  it('is 0 without a usable goal or a negative value', () => {
    expect(goalProgressPct(10, 0)).toBe(0)
    expect(goalProgressPct(10, -4)).toBe(0)
    expect(goalProgressPct(10, Number.NaN)).toBe(0)
    expect(goalProgressPct(-3, 10)).toBe(0)
  })
})
