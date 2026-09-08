import { describe, expect, it } from 'vitest'
import { BODY_RADIUS, PROFILE_SAMPLES, toPoints, viewBoxAttr } from '../morph'
import {
  ANIMATION_STATES,
  STATE_REGISTRY,
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

  it.each(['Alert', 'Exclamation'] as const)('draws a period below the %s bar', (state) => {
    expect(STATE_REGISTRY[state].dots.length).toBeGreaterThanOrEqual(1)
  })

  it('fits every state silhouette inside the render frame', () => {
    const [minX, minY, width, height] = viewBoxAttr().split(' ').map(Number)
    const maxX = minX! + width!
    const maxY = minY! + height!
    const epsilon = 0.01

    for (const state of ANIMATION_STATES) {
      for (const point of toPoints(STATE_SILHOUETTES[state], BODY_RADIUS)) {
        expect(point.x, `${state} x=${point.x}`).toBeGreaterThanOrEqual(minX! - epsilon)
        expect(point.x, `${state} x=${point.x}`).toBeLessThanOrEqual(maxX + epsilon)
        expect(point.y, `${state} y=${point.y}`).toBeGreaterThanOrEqual(minY! - epsilon)
        expect(point.y, `${state} y=${point.y}`).toBeLessThanOrEqual(maxY + epsilon)
      }
    }
  })

  it('uses measured radii for Egg, Hexagon, and Play', () => {
    expect(STATE_REGISTRY.Egg.silhouette.radii[0]).toBe(0.8369)
    expect(STATE_REGISTRY.Hexagon.silhouette.radii[0]).toBe(0.921)
    expect(STATE_REGISTRY.Play.silhouette.radii[0]).toBe(0.7819)
    expect(pathForState('Egg')).toMatch(/^M38\.5 /)
    expect(pathForState('Hexagon')).toMatch(/^M42\.37 /)
    expect(pathForState('Play')).toMatch(/^M35\.97 /)
  })
})
