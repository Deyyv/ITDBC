import { describe, expect, it } from 'vitest'
import { CAMERA_PRESETS, ELECTRONICS, PART_BY_ID, RING, SENSOR_ANCHORS, SLEEVE } from './config'

describe('electronics box placement', () => {
  const [, boxY, boxZ] = ELECTRONICS.boxPosition
  const [, boxHeight, boxDepth] = PART_BY_ID['caja-electrica'].sizeMm

  it('sits above the white ring instead of overlapping it', () => {
    expect(boxY).toBeGreaterThanOrEqual(RING.topY)
    expect(boxY - RING.topY).toBeLessThan(5)
  })

  it('is pushed out past the sleeve lip', () => {
    expect(boxZ - SLEEVE.outerHalfMm).toBeGreaterThanOrEqual(SLEEVE.lipMm)
  })

  it('keeps the lid flush with the open face of the box', () => {
    expect(ELECTRONICS.lidPosition[1]).toBe(boxY)
    expect(ELECTRONICS.lidPosition[2]).toBe(boxZ + boxDepth)
  })

  it('feeds the part table and puts the controller pin on the lid', () => {
    expect(PART_BY_ID['caja-electrica'].position).toBe(ELECTRONICS.boxPosition)
    const controller = SENSOR_ANCHORS.find((anchor) => anchor.id === 'controller')
    if (!controller) throw new Error('controller anchor missing')
    const [, anchorY, anchorZ] = controller.position
    expect(anchorY).toBeGreaterThan(boxY)
    expect(anchorY).toBeLessThan(boxY + boxHeight)
    expect(anchorZ).toBeGreaterThan(boxZ + boxDepth)
  })
})

describe('camera presets', () => {
  it('use unit-ish directions and a positive radius', () => {
    for (const preset of Object.values(CAMERA_PRESETS)) {
      const length = Math.hypot(...preset.direction)
      expect(length).toBeGreaterThan(0.99)
      expect(length).toBeLessThan(1.01)
      expect(preset.radiusMm).toBeGreaterThan(100)
    }
  })

  it('contain the electronics box in the assembled views', () => {
    const [, boxY, boxZ] = ELECTRONICS.boxPosition
    const boxTop = boxY + PART_BY_ID['caja-electrica'].sizeMm[1]
    for (const id of ['iso', 'front', 'top'] as const) {
      const { target, radiusMm } = CAMERA_PRESETS[id]
      const reach = Math.hypot(0, boxTop - target[1], boxZ + 29 - target[2])
      expect(reach).toBeLessThan(radiusMm)
    }
  })
})
