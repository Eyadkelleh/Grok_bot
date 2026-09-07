import { describe, expect, it } from 'vitest'
import { PROFILE_SAMPLES } from '../morph'
import { ANIMATION_STATES, STATE_REGISTRY } from '../states'

describe('STATE_REGISTRY', () => {
  it('stores a 64-sample radial profile with positive radii for every state', () => {
    for (const id of ANIMATION_STATES) {
      const { radii } = STATE_REGISTRY[id].silhouette
      expect(radii).toHaveLength(PROFILE_SAMPLES)
      expect(radii.every((r) => r > 0 && Number.isFinite(r))).toBe(true)
    }
  })

  it('keeps Idle as a unit circle and Thinking as a smaller one', () => {
    const idle = STATE_REGISTRY.Idle.silhouette.radii
    const thinking = STATE_REGISTRY.Thinking.silhouette.radii
    expect(idle.every((r) => r === 1)).toBe(true)
    expect(thinking.every((r) => r < 0.5)).toBe(true)
    expect(STATE_REGISTRY.Thinking.dots).toHaveLength(2)
  })
})
