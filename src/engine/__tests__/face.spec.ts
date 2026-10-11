import { describe, expect, it } from 'vitest'
import {
  AvatarEngine,
  EYE_H,
  EYE_SPLIT,
  EYE_W,
  LIFE_DRIFT_X,
  LIFE_DRIFT_Y,
  REST_GAZE,
  STILL_LIFE,
  blinkScale,
  eyeAxes,
  eyePoses,
  forcedBlinkLid,
  lifeFromSpec,
  liveliness,
  projectEye,
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

  it('shuts the forced blink lid at mid-phase and opens it at the ends', () => {
    expect(forcedBlinkLid(0)).toBe(1)
    expect(forcedBlinkLid(0.5)).toBe(0)
    expect(forcedBlinkLid(1)).toBe(1)
    expect(forcedBlinkLid(0.25)).toBeCloseTo(0.5)
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
    expect(e.sample(2.4).eyes.map((eye) => [eye.x, eye.y, eye.ry, eye.a, eye.b, eye.c, eye.d])).toEqual(
      first.eyes.map((eye) => [eye.x, eye.y, eye.ry, eye.a, eye.b, eye.c, eye.d]),
    )
    expect(sampleAt(2.4, spec).gaze).toEqual(first.gaze)
  })
})

describe('capsule inclination', () => {
  const shortAxis = (e: { a: number; b: number }, w: number) => Math.hypot(e.a, e.b) * w
  const longAxis = (e: { c: number; d: number }, h: number) => Math.hypot(e.c, e.d) * h
  const longAngle = (e: { c: number; d: number }) => Math.atan2(e.d, e.c)

  it('reproduces measured rest and rolled poses on the sphere', () => {
    const poses = [
      {
        name: 'rest',
        gaze: REST_GAZE,
        split: EYE_SPLIT,
        w: EYE_W,
        h: EYE_H,
        eyes: [
          { x: 0.189, y: -0.412, short: 0.178, long: 0.39 },
          { x: 0.614, y: -0.51, short: 0.12, long: 0.395 },
        ],
      },
      {
        name: 'wide',
        gaze: { yaw: 6.92, pitch: -21.96, roll: 11.6 },
        split: 18.43,
        w: 0.356,
        h: 0.875,
        eyes: [
          { x: -0.198, y: 0.295, short: 0.353, long: 0.82 },
          { x: 0.412, y: 0.415, short: 0.315, long: 0.826 },
        ],
      },
      {
        name: 'notify',
        gaze: { yaw: -21.94, pitch: -5.82, roll: -12.2 },
        split: 18.89,
        w: 0.505,
        h: 0.498,
        eyes: [
          { x: -0.675, y: 0.172, short: 0.39, long: 0.495 },
          { x: -0.059, y: 0.027, short: 0.495, long: 0.5 },
        ],
      },
    ] as const

    for (const m of poses) {
      const frames = eyePoses(m.gaze, 1, m.split)
      for (let i = 0; i < 2; i++) {
        const p = frames[i]!
        const want = m.eyes[i]!
        expect(p.x, m.name).toBeCloseTo(want.x, 1)
        expect(p.y, m.name).toBeCloseTo(want.y, 1)
        expect(Math.abs(shortAxis(p, m.w) - want.short), m.name).toBeLessThan(0.04)
        expect(Math.abs(longAxis(p, m.h) - want.long), m.name).toBeLessThan(0.04)
      }
    }
  })

  it('bakes per-eye tilt into the tangent matrix', () => {
    const pose = { a: 1, b: 0, c: 0, d: 1 }
    const axes = eyeAxes(pose, 30)
    expect(axes.a).toBeCloseTo(Math.sqrt(3) / 2, 6)
    expect(axes.b).toBeCloseTo(0.5, 6)
    expect(axes.c).toBeCloseTo(-0.5, 6)
    expect(axes.d).toBeCloseTo(Math.sqrt(3) / 2, 6)
    expect(longAngle(axes)).not.toBeCloseTo(Math.PI / 2, 2)
  })

  it('applies lid squash on screen Y after inclination', () => {
    const axes = projectEye({ a: 1, b: 0, c: 0, d: 1 }, 30, 0.5)
    const k = blinkScale(0.5)
    const open = eyeAxes({ a: 1, b: 0, c: 0, d: 1 }, 30)
    expect(axes.a).toBeCloseTo(open.a, 6)
    expect(axes.c).toBeCloseTo(open.c, 6)
    expect(axes.b).toBeCloseTo(open.b * k, 6)
    expect(axes.d).toBeCloseTo(open.d * k, 6)
  })

  it('rolls the sampled capsule, not only the centre', () => {
    const gaze = { yaw: 0, pitch: 0, roll: 0 }
    const rolled = { yaw: 0, pitch: 0, roll: 35 }
    const flat = sampleAvatar({ expression: 'angry', gaze })
    const tilt = sampleAvatar({ expression: 'angry', gaze: rolled })
    expect(flat.eyes[0]?.tilt).toBe(0)
    expect(tilt.eyes[0]?.tilt).toBe(0)
    expect(longAngle(flat.eyes[0]!)).not.toBeCloseTo(Math.PI / 2, 2)
    expect(longAngle(tilt.eyes[0]!)).not.toBeCloseTo(longAngle(flat.eyes[0]!), 2)
    expect(tilt.eyes[0]!.x).not.toBeCloseTo(flat.eyes[0]!.x, 2)
    expect(tilt.eyes[0]!.a).not.toBeCloseTo(flat.eyes[0]!.a, 3)
  })
})
