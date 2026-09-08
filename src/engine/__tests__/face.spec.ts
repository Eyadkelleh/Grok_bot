import { describe, expect, it } from 'vitest'
import {
  AvatarEngine,
  LIFE_DRIFT_X,
  LIFE_DRIFT_Y,
  REST_GAZE,
  STILL_LIFE,
  lifeFromSpec,
  liveliness,
  sampleAt,
  sampleAvatar,
} from '..'

const ALIVE = { wander: 1, blink: true, float: true } as const

describe('liveliness(t)', () => {
  it('is a pure function of time: same t yields the same deltas', () => {
    const a = liveliness(2.15, ALIVE)
    const b = liveliness(2.15, ALIVE)
    expect(a).toEqual(b)
    expect(liveliness(4.8, ALIVE)).not.toEqual(a)
  })

  it('stays still when wander, blink, and float are off', () => {
    expect(liveliness(3.3, { wander: 0, blink: false, float: false })).toEqual(STILL_LIFE)
  })

  it('keeps lids open at the L0 dump date t=1, before the first blink', () => {
    expect(liveliness(1, { wander: 0, blink: true, float: false }).lid).toBe(1)
  })

  it('closes the lids during a blink and reopens after it', () => {
    const mid = liveliness(1.49, { wander: 0, blink: true, float: false }).lid
    expect(mid).toBeLessThan(0.5)
    expect(liveliness(1.7, { wander: 0, blink: true, float: false }).lid).toBe(1)
  })

  it('drifts gaze across a multi-second rest', () => {
    const a = liveliness(0.4, { wander: 1, blink: false, float: false })
    const b = liveliness(3.2, { wander: 1, blink: false, float: false })
    expect(a.dYaw).not.toBeCloseTo(b.dYaw, 4)
    expect(a.dPitch).not.toBeCloseTo(b.dPitch, 4)
  })

  it('keeps body float within the rest envelope', () => {
    for (const t of [0, 0.7, 1.4, 2.9, 8]) {
      const life = liveliness(t, { wander: 0, blink: false, float: true })
      expect(Math.abs(life.driftX)).toBeLessThanOrEqual(LIFE_DRIFT_X + 1e-12)
      expect(Math.abs(life.driftY)).toBeLessThanOrEqual(LIFE_DRIFT_Y + 1e-12)
    }
  })
})

describe('sampleAvatar rest life', () => {
  it('leaves default Idle identical to the still dump path', () => {
    const still = sampleAvatar({ state: 'Idle', shape: 'circle', expression: 'neutral' })
    const dated = sampleAvatar({ state: 'Idle', shape: 'circle', expression: 'neutral', t: 5 })
    expect(dated.path).toBe(still.path)
    expect(dated.eyes.map((eye) => [eye.x, eye.y, eye.ry])).toEqual(
      still.eyes.map((eye) => [eye.x, eye.y, eye.ry]),
    )
    expect(dated.gaze).toEqual(REST_GAZE)
    expect(lifeFromSpec({})).toBeNull()
  })

  it('moves gaze and/or lids when wander is on', () => {
    const rest = sampleAvatar({ state: 'Idle', expression: 'neutral' })
    const early = sampleAvatar({ state: 'Idle', expression: 'neutral', t: 0.5, wander: 1 })
    const later = sampleAvatar({ state: 'Idle', expression: 'neutral', t: 3.1, wander: 1 })
    expect(early.gaze.yaw).not.toBeCloseTo(rest.gaze.yaw, 3)
    expect(later.gaze.yaw).not.toBeCloseTo(early.gaze.yaw, 3)
    expect(later.eyes[0]?.x).not.toBeCloseTo(early.eyes[0]!.x, 3)
  })

  it('blinks the rest face on the calendar when enabled', () => {
    const open = sampleAvatar({ state: 'Idle', t: 1, blink: true })
    const shut = sampleAvatar({ state: 'Idle', t: 1.49, blink: true })
    expect(open.eyes[0]?.ry).toBeGreaterThan(shut.eyes[0]!.ry)
    expect(open.path).toBe(sampleAvatar({ state: 'Idle' }).path)
  })

  it('replays the same dated frame from the clock when liveliness is on', () => {
    const spec = { state: 'Idle' as const, wander: 1, blink: true, float: true }
    const e = new AvatarEngine(spec)
    const first = e.sample(2.4)
    e.sample(6)
    expect(e.sample(2.4).path).toBe(first.path)
    expect(e.sample(2.4).gaze).toEqual(first.gaze)
    expect(e.sample(2.4).eyes.map((eye) => [eye.x, eye.y, eye.ry])).toEqual(
      first.eyes.map((eye) => [eye.x, eye.y, eye.ry]),
    )
    expect(sampleAt(2.4, spec).gaze).toEqual(first.gaze)
  })
})
