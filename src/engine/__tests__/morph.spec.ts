import { describe, expect, it } from 'vitest'
import { PROFILE_SAMPLES, blend, circle, closedPath, morphPath, toPoints } from '..'

describe('radial morph', () => {
  it('samples every silhouette at the same angle count', () => {
    const a = circle(1)
    const b = circle(0.5)
    expect(a.radii).toHaveLength(PROFILE_SAMPLES)
    expect(b.radii).toHaveLength(PROFILE_SAMPLES)
  })

  it('lerps radii so t=0 is the start pose and t=1 is the end pose', () => {
    const a = circle(1)
    const b = circle(0.5, { cx: 0.2 })
    const start = blend(a, b, 0)
    const end = blend(a, b, 1)
    const mid = blend(a, b, 0.5)
    expect(start.radii[0]).toBe(1)
    expect(end.radii[0]).toBe(0.5)
    expect(mid.radii[0]).toBe(0.75)
    expect(mid.cx).toBeCloseTo(0.1)
  })

  it('does not mutate the input silhouettes', () => {
    const a = circle(1)
    const b = circle(0.5)
    const before = [...a.radii]
    blend(a, b, 0.3)
    expect(a.radii).toEqual(before)
    expect(morphPath('Idle', 'Thinking', 0.4)).toBe(morphPath('Idle', 'Thinking', 0.4))
  })

  it('emits a closed SVG path from a circular profile', () => {
    const d = closedPath(toPoints(circle(1), 46))
    expect(d.startsWith('M')).toBe(true)
    expect(d.endsWith('Z')).toBe(true)
    expect(d).toContain('C')
  })

  it('changes the path when morphing Idle into Thinking', () => {
    const idle = morphPath('Idle', 'Thinking', 0)
    const thinking = morphPath('Idle', 'Thinking', 1)
    expect(idle).not.toBe(thinking)
    expect(idle.endsWith('Z')).toBe(true)
    expect(thinking.endsWith('Z')).toBe(true)
  })
})
