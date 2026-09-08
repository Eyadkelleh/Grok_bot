import { describe, expect, it } from 'vitest'
import {
  ANIMATION_STATES,
  STATE_GEOMETRY,
  STATE_REGISTRY,
  poseRadii,
  resolveStateGeometry,
  sampleAvatar,
  usesCustomiserShape,
  type AnimationState,
} from '..'

const WEARABLE: AnimationState[] = [
  'Idle',
  'Thinking',
  'Wink',
  'WideEyes',
  'Notification',
  'Sleep',
  'Burst',
  'Comet',
]

const SYMBOL: AnimationState[] = ['Alert', 'Exclamation', 'Egg', 'Hexagon', 'Play', 'Orbit']

describe('STATE_GEOMETRY', () => {
  it('classifies every catalogue state as wearable or symbol', () => {
    expect(ANIMATION_STATES).toHaveLength(14)
    expect(WEARABLE).toHaveLength(8)
    expect(SYMBOL).toHaveLength(6)
    for (const state of WEARABLE) {
      expect(STATE_GEOMETRY[state].kind, state).toBe('wearable')
      expect(usesCustomiserShape(state), state).toBe(true)
    }
    for (const state of SYMBOL) {
      expect(STATE_GEOMETRY[state].kind, state).toBe('symbol')
      expect(usesCustomiserShape(state), state).toBe(false)
    }
  })

  it('extracts wearable scale and pose from the registry circle silhouette', () => {
    const sleep = STATE_GEOMETRY.Sleep
    if (sleep.kind !== 'wearable') throw new Error('Sleep must be wearable')
    const sil = STATE_REGISTRY.Sleep.silhouette
    expect(sleep.scale).toBe(sil.radii[0])
    expect(sleep.pose).toEqual({
      rot: sil.rot,
      cx: sil.cx,
      cy: sil.cy,
      sx: sil.sx,
      sy: sil.sy,
    })
    expect(sleep.dots).toEqual(STATE_REGISTRY.Sleep.dots)
    expect(sleep.face).toBe('none')
  })

  it('keeps Alert and Exclamation as eyeless glyph symbols', () => {
    expect(STATE_GEOMETRY.Alert.kind).toBe('symbol')
    expect(STATE_GEOMETRY.Exclamation.kind).toBe('symbol')
    expect(STATE_GEOMETRY.Alert.face).toBe('none')
    expect(STATE_GEOMETRY.Exclamation.face).toBe('none')
    expect(STATE_GEOMETRY.Alert.dots).toEqual(STATE_REGISTRY.Alert.dots)
    expect(STATE_GEOMETRY.Exclamation.dots).toEqual(STATE_REGISTRY.Exclamation.dots)
  })
})

describe('resolveStateGeometry', () => {
  it('wears custom radii on Sleep and keeps Alert as a glyph', () => {
    const sleepHex = resolveStateGeometry('Sleep', 'hexagon')
    const sleepCircle = resolveStateGeometry('Sleep', 'circle')
    const alertHex = resolveStateGeometry('Alert', 'hexagon')
    const alertCircle = resolveStateGeometry('Alert', 'circle')

    expect(sleepHex.kind).toBe('wearable')
    expect(sleepHex.shapeApplied).toBe(true)
    expect(sleepHex.face).toBe('none')
    expect(sleepHex.silhouette.radii).not.toEqual(sleepCircle.silhouette.radii)
    expect(sleepHex.silhouette.sx).toBe(STATE_REGISTRY.Sleep.silhouette.sx)

    expect(alertHex.kind).toBe('symbol')
    expect(alertHex.shapeApplied).toBe(false)
    expect(alertHex.silhouette).toEqual(STATE_REGISTRY.Alert.silhouette)
    expect(alertHex.silhouette).toEqual(alertCircle.silhouette)
  })

  it('matches the registry silhouette when the customiser shape is a circle', () => {
    for (const state of WEARABLE) {
      const resolved = resolveStateGeometry(state, 'circle')
      expect(resolved.silhouette, state).toEqual(STATE_REGISTRY[state].silhouette)
    }
  })
})

describe('poseRadii', () => {
  it('scales a profile then applies pose', () => {
    const sil = poseRadii([1, 2, 1], 0.5, { rot: 0.1, cx: 0.2, cy: -0.3, sx: 0.4, sy: 1.1 })
    expect(sil.radii).toEqual([0.5, 1, 0.5])
    expect(sil.rot).toBe(0.1)
    expect(sil.cx).toBe(0.2)
    expect(sil.cy).toBe(-0.3)
    expect(sil.sx).toBe(0.4)
    expect(sil.sy).toBe(1.1)
  })
})

describe('sampleAvatar geometry', () => {
  it('puts expression eyes on Idle, a wink on Wink, and none on Alert', () => {
    expect(sampleAvatar({ state: 'Idle' }).eyes).toHaveLength(2)
    const wink = sampleAvatar({ state: 'Wink' })
    const idle = sampleAvatar({ state: 'Idle' })
    expect(wink.eyes).toHaveLength(2)
    expect(wink.eyes[1]!.ry).toBeLessThan(idle.eyes[1]!.ry)
    expect(sampleAvatar({ state: 'Alert', expression: 'happy' }).eyes).toHaveLength(0)
  })

  it('leaves Alert and Play unchanged when the customiser shape is hexagon', () => {
    const alertHex = sampleAvatar({ state: 'Alert', shape: 'hexagon' })
    const alertCircle = sampleAvatar({ state: 'Alert', shape: 'circle' })
    const playHex = sampleAvatar({ state: 'Play', shape: 'hexagon' })
    const playCircle = sampleAvatar({ state: 'Play', shape: 'circle' })

    expect(alertHex.path).toBe(alertCircle.path)
    expect(alertHex.shapeApplied).toBe(false)
    expect(alertHex.geometryKind).toBe('symbol')
    expect(playHex.path).toBe(playCircle.path)
    expect(playHex.shapeApplied).toBe(false)
    expect(playHex.geometryKind).toBe('symbol')
  })
})
