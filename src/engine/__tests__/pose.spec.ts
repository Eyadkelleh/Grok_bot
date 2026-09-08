import { describe, expect, it } from 'vitest'
import { AvatarEngine, poseAt, sampleAt, sampleAvatar, STATE_REGISTRY } from '..'

function framesDiffer(a: { path: string; dots: Array<{ x: number; y: number; r: number; opacity: number }> }, b: typeof a) {
  if (a.path !== b.path) return true
  if (a.dots.length !== b.dots.length) return true
  return a.dots.some((dot, i) => {
    const other = b.dots[i]
    if (!other) return true
    return dot.x !== other.x || dot.y !== other.y || dot.r !== other.r || dot.opacity !== other.opacity
  })
}

describe('pose(t)', () => {
  it('keeps pose(0) on the still registry snapshot', () => {
    for (const state of ['Thinking', 'Sleep', 'Orbit', 'Burst', 'Comet'] as const) {
      const posed = poseAt(state, 0)
      const rest = STATE_REGISTRY[state]
      expect(posed.silhouette.radii[0], state).toBeCloseTo(rest.silhouette.radii[0]!, 5)
      expect(posed.silhouette.cx, state).toBeCloseTo(rest.silhouette.cx, 5)
      expect(posed.silhouette.cy, state).toBeCloseTo(rest.silhouette.cy, 5)
      expect(posed.silhouette.rot, state).toBeCloseTo(rest.silhouette.rot, 5)
      expect(posed.dots).toHaveLength(rest.dots.length)
    }
  })

  it('keeps Idle still at every date', () => {
    const idle = new AvatarEngine({ state: 'Idle' })
    const rest = sampleAvatar({ state: 'Idle' })
    expect(idle.sample(0.3).path).toBe(idle.sample(1.2).path)
    expect(idle.sample(0.3).path).toBe(rest.path)
    expect(poseAt('Idle', 0.3)).toEqual(STATE_REGISTRY.Idle)
    expect(poseAt('Idle', 1.2)).toEqual(STATE_REGISTRY.Idle)
  })

  it('moves Sleep and Orbit between 0.3 s and 1.2 s', () => {
    const sleep = new AvatarEngine({ state: 'Sleep' })
    const orbit = new AvatarEngine({ state: 'Orbit' })
    expect(sleep.sample(0.3).path).not.toBe(sleep.sample(1.2).path)
    expect(orbit.sample(0.3).path).not.toBe(orbit.sample(1.2).path)
    expect(poseAt('Sleep', 0.3).silhouette.cy).not.toBeCloseTo(poseAt('Sleep', 1.2).silhouette.cy, 5)
    expect(poseAt('Orbit', 0.3).silhouette.rot).not.toBeCloseTo(poseAt('Orbit', 1.2).silhouette.rot, 5)
  })

  it('moves Thinking, Burst, and Comet between 0.3 s and 1.2 s', () => {
    for (const state of ['Thinking', 'Burst', 'Comet'] as const) {
      const a = sampleAt(0.3, { state })
      const b = sampleAt(1.2, { state })
      expect(framesDiffer(a, b), state).toBe(true)
    }
  })

  it('is a pure function of local time: same t yields the same frame', () => {
    const e = new AvatarEngine({ state: 'Orbit' })
    const first = e.sample(0.85)
    e.sample(2.2)
    expect(e.sample(0.85).path).toBe(first.path)
    expect(e.sample(0.85).dots).toEqual(first.dots)
    expect(sampleAt(0.85, { state: 'Sleep' }).path).toBe(sampleAt(0.85, { state: 'Sleep' }).path)
  })
})
