import { describe, expect, it } from 'vitest'
import { sampleAvatar, sampleLiveMorph, sampleMorph } from '..'

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
})
