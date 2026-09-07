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
  'Alert',
  'Notification',
  'Exclamation',
  'Sleep',
  'Burst',
  'Comet',
]

const SYMBOL: AnimationState[] = ['Egg', 'Hexagon', 'Play', 'Orbit']

describe('STATE_GEOMETRY', () => {
  it('classifies every catalogue state as wearable or symbol', () => {
    expect(ANIMATION_STATES).toHaveLength(14)
    expect(WEARABLE).toHaveLength(10)
    expect(SYMBOL).toHaveLength(4)
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
    const alert = STATE_GEOMETRY.Alert
    if (alert.kind !== 'wearable') throw new Error('Alert must be wearable')
    const sil = STATE_REGISTRY.Alert.silhouette
    expect(alert.scale).toBe(sil.radii[0])
    expect(alert.pose).toEqual({
      rot: sil.rot,
      cx: sil.cx,
      cy: sil.cy,
      sx: sil.sx,
      sy: sil.sy,
    })
    expect(alert.dots).toEqual(STATE_REGISTRY.Alert.dots)
    expect(alert.face).toBe('none')
  })
})

describe('resolveStateGeometry', () => {
  it('wears custom radii on Alert and keeps Play as a symbol', () => {
    const alertHex = resolveStateGeometry('Alert', 'hexagon')
    const alertCircle = resolveStateGeometry('Alert', 'circle')
    const playHex = resolveStateGeometry('Play', 'hexagon')
    const playCircle = resolveStateGeometry('Play', 'circle')

    expect(alertHex.kind).toBe('wearable')
    expect(alertHex.shapeApplied).toBe(true)
    expect(alertHex.face).toBe('none')
    expect(alertHex.silhouette.radii).not.toEqual(alertCircle.silhouette.radii)
    expect(alertHex.silhouette.sx).toBe(STATE_REGISTRY.Alert.silhouette.sx)
    expect(alertHex.silhouette.rot).toBe(STATE_REGISTRY.Alert.silhouette.rot)

    expect(playHex.kind).toBe('symbol')
    expect(playHex.shapeApplied).toBe(false)
    expect(playHex.silhouette).toEqual(STATE_REGISTRY.Play.silhouette)
    expect(playHex.silhouette).toEqual(playCircle.silhouette)
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

  it('changes Alert with hexagon and leaves Play unchanged', () => {
    const alertHex = sampleAvatar({ state: 'Alert', shape: 'hexagon' })
    const alertCircle = sampleAvatar({ state: 'Alert', shape: 'circle' })
    const idleHex = sampleAvatar({ state: 'Idle', shape: 'hexagon' })
    const playHex = sampleAvatar({ state: 'Play', shape: 'hexagon' })
    const playCircle = sampleAvatar({ state: 'Play', shape: 'circle' })

    expect(alertHex.path).not.toBe(alertCircle.path)
    expect(alertHex.path).not.toBe(idleHex.path)
    expect(alertHex.shapeApplied).toBe(true)
    expect(alertHex.geometryKind).toBe('wearable')
    expect(playHex.path).toBe(playCircle.path)
    expect(playHex.shapeApplied).toBe(false)
    expect(playHex.geometryKind).toBe('symbol')
  })
})
