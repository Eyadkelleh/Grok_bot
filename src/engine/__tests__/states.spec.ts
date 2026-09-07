import { describe, expect, it } from 'vitest'
import { PROFILE_SAMPLES } from '../morph'
import {
  ANIMATION_STATES,
  STATE_SILHOUETTES,
  isAnimationState,
  pathForState,
  type AnimationState,
} from '../states'

const EXPECTED: AnimationState[] = [
  'Idle',
  'Thinking',
  'Wink',
  'WideEyes',
  'Alert',
  'Notification',
  'Exclamation',
  'Sleep',
  'Egg',
  'Hexagon',
  'Play',
  'Orbit',
  'Burst',
  'Comet',
]

describe('ANIMATION_STATES', () => {
  it('is a typed registry of the 14 catalogue states', () => {
    expect(ANIMATION_STATES).toHaveLength(14)
    expect([...ANIMATION_STATES]).toEqual(EXPECTED)
    expect(isAnimationState('Idle')).toBe(true)
    expect(isAnimationState('swirl')).toBe(false)
  })

  it('gives every state a 64-sample silhouette and a closed path', () => {
    for (const state of ANIMATION_STATES) {
      const sil = STATE_SILHOUETTES[state]
      expect(sil.radii).toHaveLength(PROFILE_SAMPLES)
      expect(sil.radii.every((r) => r > 0 && Number.isFinite(r))).toBe(true)
      const d = pathForState(state)
      expect(d.startsWith('M')).toBe(true)
      expect(d.endsWith('Z')).toBe(true)
    }
  })
})
