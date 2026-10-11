import { describe, expect, it } from 'vitest'
import { BODY_RADIUS, TEAR_PATH, barItalic, barUpright, toPoints } from '..'
import { BAR_ITALIC_RADII, BAR_UPRIGHT_RADII } from '../glyphs'
import { PROFILE_SAMPLES } from '../profiles'

const UP = Math.round((3 / 4) * PROFILE_SAMPLES) % PROFILE_SAMPLES
const DOWN = Math.round((1 / 4) * PROFILE_SAMPLES) % PROFILE_SAMPLES
const RIGHT = 0

function widthAt(sil: ReturnType<typeof barUpright>, y0: number, y1: number): number {
  const xs = toPoints(sil, BODY_RADIUS)
    .filter((p) => {
      const y = p.y / BODY_RADIUS
      return y >= y0 && y <= y1
    })
    .map((p) => p.x / BODY_RADIUS)
  if (xs.length < 2) return 0
  return Math.max(...xs) - Math.min(...xs)
}

describe('glyph bars', () => {
  it('builds a tapered upright bar from two unequal discs', () => {
    expect(BAR_UPRIGHT_RADII).toHaveLength(PROFILE_SAMPLES)
    expect(BAR_UPRIGHT_RADII[UP]!).toBeGreaterThan(BAR_UPRIGHT_RADII[DOWN]!)
    const sil = barUpright()
    const top = widthAt(sil, sil.cy - 0.45, sil.cy - 0.2)
    const bottom = widthAt(sil, sil.cy + 0.2, sil.cy + 0.4)
    expect(top).toBeGreaterThan(bottom * 1.2)
  })

  it('builds a constant-width italic capsule', () => {
    expect(BAR_ITALIC_RADII[UP]!).toBeCloseTo(BAR_ITALIC_RADII[DOWN]!, 3)
    expect(BAR_ITALIC_RADII[UP]!).toBeGreaterThan(BAR_ITALIC_RADII[RIGHT]! * 2)
    const sil = barItalic()
    expect(sil.sx).toBe(1)
    expect(sil.sy).toBe(1)
  })

  it('draws the italic period as a teardrop polyline, not a disc', () => {
    expect(TEAR_PATH.startsWith('M')).toBe(true)
    expect(TEAR_PATH.endsWith('Z')).toBe(true)
    expect(TEAR_PATH).toContain('L')
    expect(TEAR_PATH).not.toContain('C')
  })
})
