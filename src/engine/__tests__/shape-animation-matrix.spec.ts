import { describe, expect, it } from 'vitest'
import { sampleAvatar } from '../avatar'
import { BODY_RADIUS, PROFILE_SAMPLES, VIEW_HALF, blend, circle, silhouetteFromRadii } from '../morph'
import { SHAPES, type BotShape } from '../skins'
import {
  ANIMATION_STATES,
  STATE_REGISTRY,
  sampleMorph,
  type AnimationState,
} from '../states'

const FACE_STATES = ['Idle', 'Wink', 'WideEyes', 'Notification'] as const
const FACE_STATE_IDS = new Set<AnimationState>(FACE_STATES)
const EXPRESSIONS = ['neutral', 'surprised', 'laughing'] as const
const EPSILON = 0.01
const EYE_MARGIN = 1

function sampledRadius(radii: number[], angle: number): number {
  const turn = ((angle / (Math.PI * 2)) % 1 + 1) % 1
  const sample = turn * radii.length
  const lo = Math.floor(sample)
  const hi = (lo + 1) % radii.length
  const t = sample - lo
  return (radii[lo] ?? 0) * (1 - t) + (radii[hi] ?? 0) * t
}

function activeRadii(shape: BotShape, state: AnimationState): number[] {
  return FACE_STATE_IDS.has(state) ? shape.radii : STATE_REGISTRY[state].silhouette.radii
}

function pathNumbers(path: string): number[] {
  return path.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? []
}

function expectIntegrity(path: string, radii: number[], label: string) {
  expect(path.length, `${label}: empty path`).toBeGreaterThan(0)
  expect(path.startsWith('M'), `${label}: path start`).toBe(true)
  expect(path.endsWith('Z'), `${label}: path close`).toBe(true)
  expect(pathNumbers(path).every(Number.isFinite), `${label}: finite path`).toBe(true)
  expect(radii, `${label}: profile size`).toHaveLength(PROFILE_SAMPLES)
  expect(radii.every((radius) => Number.isFinite(radius) && radius > 0), `${label}: positive radii`).toBe(
    true,
  )
  for (const coordinate of pathNumbers(path)) {
    expect(coordinate, `${label}: coordinate ${coordinate}`).toBeGreaterThanOrEqual(-VIEW_HALF - EPSILON)
    expect(coordinate, `${label}: coordinate ${coordinate}`).toBeLessThanOrEqual(VIEW_HALF + EPSILON)
  }
}

describe('shape × animation integrity matrix', () => {
  it('keeps every settled shape/state cell structurally valid and inside the viewBox', () => {
    for (const shape of SHAPES) {
      for (const state of ANIMATION_STATES) {
        const label = `${shape.id}/${state}`
        const frame = sampleAvatar({ shape: shape.id, state })
        expectIntegrity(frame.path, activeRadii(shape, state), label)
        expect(frame.eyes.length, `${label}: glyph eye count`).toBe(FACE_STATE_IDS.has(state) ? 2 : 0)
      }
    }
  })

  it('keeps face eyes inside every active shape silhouette', () => {
    const violations: string[] = []
    for (const shape of SHAPES) {
      for (const state of FACE_STATES) {
        for (const expression of EXPRESSIONS) {
          const label = `${shape.id}/${state}/${expression}`
          const frame = sampleAvatar({ shape: shape.id, state, expression })
          expect(frame.eyes.length, `${label}: face eye count`).toBe(2)
          for (const [index, eye] of frame.eyes.entries()) {
            const distance = Math.hypot(eye.x, eye.y)
            const edge = sampledRadius(shape.radii, Math.atan2(eye.y, eye.x)) * BODY_RADIUS
            const effectiveRadius = Math.max(eye.rx, eye.ry) * 0.6
            if (distance >= edge - EYE_MARGIN) {
              violations.push(
                `${label}: eye ${index} centre margin ${edge - distance} < ${EYE_MARGIN}`,
              )
            }
            if (distance + effectiveRadius >= edge) {
              violations.push(
                `${label}: eye ${index} capsule ${distance + effectiveRadius} >= edge ${edge}`,
              )
            }
          }
        }
      }
    }
    expect(violations, violations.join('\n')).toEqual([])
  })

  it('keeps every Idle midpoint finite and inside the viewBox', () => {
    for (const shape of SHAPES) {
      for (const state of ANIMATION_STATES) {
        const label = `${shape.id}/Idle>${state}@0.5`
        const from = FACE_STATE_IDS.has(state) ? silhouetteFromRadii(shape.radii) : circle(1)
        const midpoint = blend(from, STATE_REGISTRY[state].silhouette, 0.5)
        const frame = sampleMorph('Idle', state, 0.5)
        expectIntegrity(frame.path, midpoint.radii, label)
      }
    }
  })
})
