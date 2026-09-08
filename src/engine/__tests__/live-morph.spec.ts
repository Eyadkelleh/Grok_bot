import { describe, expect, it } from 'vitest'
import {
  blinkScale,
  easeOutQuint,
  eyeFadeOpacity,
  sampleAvatar,
  sampleLiveMorph,
  sampleMorph,
  type AvatarFrame,
} from '..'

function eyeGeom(frame: AvatarFrame) {
  return frame.eyes.map((eye) => [eye.x, eye.y, eye.rx, eye.ry, eye.a, eye.b, eye.c, eye.d, eye.tilt])
}

describe('sampleLiveMorph', () => {
  it('uses the customiser silhouette during face-state morphs', () => {
    const frame = sampleLiveMorph({
      from: 'Idle',
      to: 'Wink',
      shape: 'triangle',
      t: 0.5,
    })

    expect(frame.path).not.toBe(sampleMorph('Idle', 'Wink', 0.5).path)
    expect(frame.eyes).toHaveLength(2)
  })

  it('interpolates between customiser shapes', () => {
    const circle = sampleAvatar({ state: 'Idle', shape: 'circle' }).path
    const triangle = sampleAvatar({ state: 'Idle', shape: 'triangle' }).path
    const frame = sampleLiveMorph({
      from: 'Idle',
      to: 'Idle',
      fromShape: 'circle',
      toShape: 'triangle',
      t: 0.5,
    })

    expect(frame.path).not.toBe(circle)
    expect(frame.path).not.toBe(triangle)
  })

  it('masks a blinkIn morph with both lids shut at mid-progress', () => {
    const idle = sampleAvatar({ state: 'Idle' })
    const wink = sampleLiveMorph({ from: 'Idle', to: 'Wink', t: 0.5 })
    const wide = sampleLiveMorph({ from: 'Idle', to: 'WideEyes', t: 0.5 })

    expect(wink.eyes).toHaveLength(2)
    // Measured faces (K5) size eyes per pose; assert lids are shut, not Idle-sized.
    expect(wink.eyes[0]!.ry).toBeLessThan(idle.eyes[0]!.ry * 0.2)
    expect(wink.eyes[1]!.ry).toBeLessThan(idle.eyes[1]!.ry * 0.2)
    expect(wide.eyes[0]!.ry).toBeLessThan(idle.eyes[0]!.ry * 0.2)
    expect(wide.eyes[1]!.ry).toBeLessThan(idle.eyes[1]!.ry * 0.2)
    expect(blinkScale(0)).toBeLessThan(0.15)
  })

  it('keeps open lids on a non-blinkIn morph and on a shape-only morph', () => {
    const idle = sampleAvatar({ state: 'Idle' })
    const settledWink = sampleAvatar({ state: 'Wink' })
    const toIdle = sampleLiveMorph({ from: 'Wink', to: 'Idle', t: 0.5 })
    const toAlert = sampleLiveMorph({ from: 'Idle', to: 'Alert', t: 0.5 })
    const shape = sampleLiveMorph({
      from: 'Idle',
      to: 'Idle',
      fromShape: 'circle',
      toShape: 'triangle',
      t: 0.5,
    })

    expect(toIdle.eyes[0]!.ry).toBeCloseTo(idle.eyes[0]!.ry, 5)
    expect(toIdle.eyes[1]!.ry).toBeCloseTo(idle.eyes[1]!.ry, 5)
    expect(toIdle.eyes[1]!.ry).toBeGreaterThan(settledWink.eyes[1]!.ry)
    expect(shape.eyes[0]!.ry).toBeCloseTo(idle.eyes[0]!.ry, 5)
    // Alert is not blinkIn — mid-morph keeps the open-lid path (no forced shut).
    expect(toAlert.eyes.length === 0 || toAlert.eyes[0]!.ry > idle.eyes[0]!.ry * 0.5).toBe(true)
  })

  it('replays the same blinkIn midpoint', () => {
    const a = sampleLiveMorph({ from: 'Idle', to: 'Notification', t: 0.5 })
    const b = sampleLiveMorph({ from: 'Idle', to: 'Notification', t: 0.5 })
    expect(b.eyes.map((eye) => [eye.x, eye.y, eye.ry])).toEqual(a.eyes.map((eye) => [eye.x, eye.y, eye.ry]))
    expect(b.path).toBe(a.path)
  })

  it('freezes outgoing Idle eyes while fading into an eyeless glyph', () => {
    const idle = sampleAvatar({ state: 'Idle' })
    const still = sampleLiveMorph({ from: 'Idle', to: 'Orbit', t: 0.5, wander: 0 })
    const alive = sampleLiveMorph({
      from: 'Idle',
      to: 'Orbit',
      t: 0.5,
      wander: 1,
      blink: true,
      float: true,
    })
    const fade = eyeFadeOpacity(true, false, easeOutQuint(0.5))

    expect(still.eyes).toHaveLength(2)
    expect(eyeGeom(alive)).toEqual(eyeGeom(still))
    expect(still.eyes[0]!.opacity).toBeCloseTo(fade, 8)
    expect(still.eyes[0]!.opacity).toBeLessThan(1)
    expect(still.eyes[0]!.opacity).toBeGreaterThan(0.01)
    expect(still.eyes[0]!.x).toBeCloseTo(idle.eyes[0]!.x, 5)
    expect(still.eyes[0]!.y).toBeCloseTo(idle.eyes[0]!.y, 5)
    expect(still.eyes[0]!.ry).toBeCloseTo(idle.eyes[0]!.ry, 5)
    expect(still.eyes[1]!.x).toBeCloseTo(idle.eyes[1]!.x, 5)
    expect(still.path).not.toBe(idle.path)
    expect(still.gaze).toEqual(idle.gaze)
  })

  it('freezes arriving Idle eyes while fading out of an eyeless glyph', () => {
    const idle = sampleAvatar({ state: 'Idle' })
    const still = sampleLiveMorph({ from: 'Orbit', to: 'Idle', t: 0.5, wander: 0 })
    const alive = sampleLiveMorph({ from: 'Orbit', to: 'Idle', t: 0.5, wander: 1 })

    expect(eyeGeom(alive)).toEqual(eyeGeom(still))
    expect(still.eyes[0]!.x).toBeCloseTo(idle.eyes[0]!.x, 5)
    expect(still.eyes[0]!.ry).toBeCloseTo(idle.eyes[0]!.ry, 5)
    expect(still.eyes[0]!.opacity).toBeCloseTo(eyeFadeOpacity(false, true, easeOutQuint(0.5)), 8)
    expect(still.eyes[0]!.opacity).toBeLessThan(1)
  })
})
