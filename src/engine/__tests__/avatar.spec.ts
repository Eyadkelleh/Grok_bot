import { describe, expect, it } from 'vitest'
import {
  COLORS,
  DEFAULT_COLOR,
  DEFAULT_EXPRESSION,
  DEFAULT_SHAPE,
  EXPRESSIONS,
  PROFILE_SAMPLES,
  REST_GAZE,
  SHAPES,
  eyePoses,
  resolveColour,
  sampleAvatar,
} from '..'

describe('skins', () => {
  it('catalogues eight body shapes and twelve colours', () => {
    expect(SHAPES.map((s) => s.id)).toEqual([
      'circle',
      'pebble',
      'squircle',
      'capsule',
      'triangle',
      'hexagon',
      'cloud',
      'droplet',
    ])
    expect(COLORS).toHaveLength(12)
    expect(DEFAULT_SHAPE).toBe('circle')
    expect(DEFAULT_COLOR).toBe('ink')
    for (const shape of SHAPES) {
      expect(shape.radii).toHaveLength(PROFILE_SAMPLES)
      expect(shape.radii.every((r) => r > 0 && Number.isFinite(r))).toBe(true)
    }
  })

  it('resolves named colours and raw hex', () => {
    expect(resolveColour('blue')).toBe('#3b93f0')
    expect(resolveColour('#abc123')).toBe('#abc123')
    expect(resolveColour('nope')).toBe('#0a0a0c')
  })
})

describe('expressions', () => {
  it('catalogues sixteen rest expressions', () => {
    expect(EXPRESSIONS).toHaveLength(16)
    expect(DEFAULT_EXPRESSION).toBe('neutral')
    expect(EXPRESSIONS[0]?.gaze).toEqual(REST_GAZE)
  })
})

describe('sampleAvatar', () => {
  it.each(['Alert', 'Sleep'] as const)('does not render expression eyes for %s', (state) => {
    expect(sampleAvatar({ state }).eyes).toHaveLength(0)
  })

  it('changes the body path when the shape changes', () => {
    const circle = sampleAvatar({ shape: 'circle' })
    const hexagon = sampleAvatar({ shape: 'hexagon' })
    expect(circle.path).not.toBe(hexagon.path)
    expect(hexagon.path.startsWith('M')).toBe(true)
    expect(hexagon.shape).toBe('hexagon')
  })

  it('applies gaze as a yaw number or a full pose', () => {
    const yaw = sampleAvatar({ gaze: -20 })
    expect(yaw.gaze.yaw).toBe(-20)
    expect(yaw.gaze.pitch).toBe(REST_GAZE.pitch)

    const pose = sampleAvatar({ gaze: { yaw: 5, pitch: 1, roll: 2 } })
    expect(pose.gaze).toEqual({ yaw: 5, pitch: 1, roll: 2 })
  })

  it('puts eyes in different places for different gazes', () => {
    const a = eyePoses({ yaw: 0, pitch: 0, roll: 0 }, 46)
    const b = eyePoses({ yaw: 30, pitch: 0, roll: 0 }, 46)
    expect(a[0].x).not.toBeCloseTo(b[0].x, 1)
  })

  it('keeps a custom shape on Idle and the state silhouette on Play', () => {
    const idle = sampleAvatar({ shape: 'triangle', state: 'Idle' })
    const play = sampleAvatar({ shape: 'triangle', state: 'Play' })
    const triangle = sampleAvatar({ shape: 'triangle' })
    expect(idle.path).toBe(triangle.path)
    expect(play.path).not.toBe(triangle.path)
    expect(play.eyes).toHaveLength(0)
  })
})
