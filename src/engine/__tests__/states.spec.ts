import { describe, expect, it } from 'vitest'
import { BODY_RADIUS, PROFILE_SAMPLES, circle, silhouettePath, toPoints, viewBoxAttr } from '../morph'
import {
  ANIMATION_STATES,
  STATE_REGISTRY,
  STATE_SILHOUETTES,
  blinksIn,
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

  it('does not use squashed-circle shortcuts for Alert or Exclamation', () => {
    const alertShortcut = circle(1, { sx: 0.22, sy: 1.02, rot: 0.28, cy: -0.22 })
    const exclaimShortcut = circle(1, { sx: 0.22, sy: 1.02, cy: -0.22 })
    expect(pathForState('Alert')).not.toBe(silhouettePath(alertShortcut))
    expect(pathForState('Exclamation')).not.toBe(silhouettePath(exclaimShortcut))
    expect(new Set(STATE_REGISTRY.Alert.silhouette.radii).size).toBeGreaterThan(1)
    expect(new Set(STATE_REGISTRY.Exclamation.silhouette.radii).size).toBeGreaterThan(1)
  })

  it('uses a tapered upright bar and a round period for Exclamation', () => {
    const sil = STATE_REGISTRY.Exclamation.silhouette
    const up = Math.round((3 / 4) * PROFILE_SAMPLES) % PROFILE_SAMPLES
    const down = Math.round((1 / 4) * PROFILE_SAMPLES) % PROFILE_SAMPLES
    expect(sil.radii[up]!).toBeGreaterThan(sil.radii[down]!)
    expect(sil.sx).toBe(1)
    expect(sil.sy).toBe(1)
    const period = STATE_REGISTRY.Exclamation.dots[0]!
    expect(period.d).toBeUndefined()
    expect(period.r).toBeCloseTo(0.113)
    expect(period.y).toBeGreaterThan(sil.cy)
  })

  it('uses a capsule bar and a teardrop italic period for Alert', () => {
    const sil = STATE_REGISTRY.Alert.silhouette
    const right = 0
    const up = Math.round((3 / 4) * PROFILE_SAMPLES) % PROFILE_SAMPLES
    const down = Math.round((1 / 4) * PROFILE_SAMPLES) % PROFILE_SAMPLES
    expect(sil.radii[up]!).toBeGreaterThan(sil.radii[right]! * 2)
    expect(Math.abs(sil.radii[up]! - sil.radii[down]!)).toBeLessThan(0.02)
    expect(sil.rot).toBeCloseTo((17.7 * Math.PI) / 180)
    const period = STATE_REGISTRY.Alert.dots[0]!
    expect(period.d).toMatch(/^M/)
    expect(period.d).toMatch(/Z$/)
    expect(period.d).toContain('L')
    expect(period.rot).toBeCloseTo(17.7)
    expect(period.r).toBeCloseTo(0.118)
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

  it('flags blinkIn on the arriving states that hide a shape morph', () => {
    const masked: AnimationState[] = [
      'Thinking',
      'Wink',
      'WideEyes',
      'Notification',
      'Egg',
      'Hexagon',
      'Play',
    ]
    const open: AnimationState[] = ['Idle', 'Alert', 'Exclamation', 'Sleep', 'Orbit', 'Burst', 'Comet']
    for (const state of masked) expect(blinksIn(state), state).toBe(true)
    for (const state of open) expect(blinksIn(state), state).toBe(false)
  })
})
