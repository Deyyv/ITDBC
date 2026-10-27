import { describe, expect, it } from 'vitest'
import { CAMERA_FOV_DEG, CAMERA_PRESETS } from './config'
import { fitDistanceMm, framedPosition, halfFovs } from './framing'

describe('fitDistanceMm', () => {
  const radiusMm = 250

  it('keeps the whole sphere inside both view cones', () => {
    for (const aspect of [0.5, 0.75, 1, 1.4, 2.2]) {
      const distance = fitDistanceMm({ radiusMm, fovDeg: CAMERA_FOV_DEG, aspect, margin: 1 })
      const { vertical, horizontal } = halfFovs(CAMERA_FOV_DEG, aspect)
      expect(Math.asin(radiusMm / distance)).toBeLessThanOrEqual(Math.min(vertical, horizontal) + 1e-9)
    }
  })

  it('touches the vertical edge on landscape canvases and the horizontal one on portrait', () => {
    const fov = CAMERA_FOV_DEG
    const landscape = fitDistanceMm({ radiusMm, fovDeg: fov, aspect: 1.6, margin: 1 })
    expect(landscape).toBeCloseTo(radiusMm / Math.sin(halfFovs(fov, 1.6).vertical), 6)

    const portrait = fitDistanceMm({ radiusMm, fovDeg: fov, aspect: 0.6, margin: 1 })
    expect(portrait).toBeCloseTo(radiusMm / Math.sin(halfFovs(fov, 0.6).horizontal), 6)
    expect(portrait).toBeGreaterThan(landscape)
  })

  it('does not move once the canvas is wider than the vertical limit', () => {
    const a = fitDistanceMm({ radiusMm, fovDeg: CAMERA_FOV_DEG, aspect: 1.5 })
    const b = fitDistanceMm({ radiusMm, fovDeg: CAMERA_FOV_DEG, aspect: 3 })
    expect(a).toBeCloseTo(b, 6)
  })

  it('grows with the radius and with the margin', () => {
    const base = fitDistanceMm({ radiusMm, fovDeg: CAMERA_FOV_DEG, aspect: 1 })
    expect(fitDistanceMm({ radiusMm: radiusMm * 2, fovDeg: CAMERA_FOV_DEG, aspect: 1 })).toBeCloseTo(
      base * 2,
      6,
    )
    expect(fitDistanceMm({ radiusMm, fovDeg: CAMERA_FOV_DEG, aspect: 1, margin: 1.5 })).toBeGreaterThan(base)
  })

  it('survives a degenerate canvas', () => {
    const distance = fitDistanceMm({ radiusMm, fovDeg: CAMERA_FOV_DEG, aspect: 0 })
    expect(Number.isFinite(distance)).toBe(true)
    expect(distance).toBeGreaterThan(radiusMm)
  })
})

describe('framedPosition', () => {
  it('sits on the view direction at the fit distance from the target', () => {
    for (const preset of Object.values(CAMERA_PRESETS)) {
      const aspect = 1.3
      const position = framedPosition(preset, CAMERA_FOV_DEG, aspect)
      const offset = [
        position[0] - preset.target[0],
        position[1] - preset.target[1],
        position[2] - preset.target[2],
      ]
      const expected = fitDistanceMm({ radiusMm: preset.radiusMm, fovDeg: CAMERA_FOV_DEG, aspect })
      expect(Math.hypot(...offset)).toBeCloseTo(expected, 4)
    }
  })

  it('pulls every preset further back on a narrow canvas', () => {
    for (const preset of Object.values(CAMERA_PRESETS)) {
      const wide = framedPosition(preset, CAMERA_FOV_DEG, 1.6)
      const narrow = framedPosition(preset, CAMERA_FOV_DEG, 0.7)
      const distance = (p: readonly number[]) =>
        Math.hypot(p[0] - preset.target[0], p[1] - preset.target[1], p[2] - preset.target[2])
      expect(distance(narrow)).toBeGreaterThan(distance(wide))
    }
  })

  it('frames the exploded view with a larger sphere than the assembled one', () => {
    expect(CAMERA_PRESETS.exploded.radiusMm).toBeGreaterThan(CAMERA_PRESETS.iso.radiusMm)
  })
})
