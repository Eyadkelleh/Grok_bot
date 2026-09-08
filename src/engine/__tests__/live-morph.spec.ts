import { describe, expect, it } from 'vitest'
import { blinkScale, sampleAvatar, sampleLiveMorph, sampleMorph } from '..'

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
    const shut = idle.eyes[0]!.ry * blinkScale(0)

    expect(wink.eyes).toHaveLength(2)
    expect(wink.eyes[0]!.ry).toBeCloseTo(shut, 5)
    expect(wink.eyes[1]!.ry).toBeCloseTo(shut, 5)
    expect(wide.eyes[0]!.ry).toBeLessThan(idle.eyes[0]!.ry * 0.2)
    expect(wide.eyes[1]!.ry).toBeLessThan(idle.eyes[1]!.ry * 0.2)
  })

  it('keeps open lids on a non-blinkIn morph and on a shape-only morph', () => {
    const idle = sampleAvatar({ state: 'Idle' })
    const notify = sampleAvatar({ state: 'Notification' })
    const settledWink = sampleAvatar({ state: 'Wink' })
    const toIdle = sampleLiveMorph({ from: 'Wink', to: 'Idle', t: 0.5 })
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
    expect(notify.eyes[0]!.ry).toBeCloseTo(idle.eyes[0]!.ry, 5)
  })

  it('replays the same blinkIn midpoint', () => {
    const a = sampleLiveMorph({ from: 'Idle', to: 'Notification', t: 0.5 })
    const b = sampleLiveMorph({ from: 'Idle', to: 'Notification', t: 0.5 })
    expect(b.eyes.map((eye) => [eye.x, eye.y, eye.ry])).toEqual(a.eyes.map((eye) => [eye.x, eye.y, eye.ry]))
    expect(b.path).toBe(a.path)
  })
})
