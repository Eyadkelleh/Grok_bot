import { describe, expect, it } from 'vitest'
import {
  ANIMATION_STATES,
  BODY_RADIUS,
  VIEW_HALF,
  sampleAvatar,
  sampleMorph,
} from '..'

const NON_FACE_STATES = [
  'Alert',
  'Sleep',
  'Exclamation',
  'Thinking',
  'Burst',
  'Comet',
] as const
const EXPRESSIONS = ['neutral', 'happy', 'angry']
const SHAPES = ['circle', 'hexagon', 'droplet']
const EPSILON = 0.01

function expectPathInsideFrame(path: string, label: string) {
  const coordinates = path.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? []
  expect(coordinates.length, label).toBeGreaterThan(0)
  for (const coordinate of coordinates) {
    expect(coordinate, label).toBeGreaterThanOrEqual(-VIEW_HALF - EPSILON)
    expect(coordinate, label).toBeLessThanOrEqual(VIEW_HALF + EPSILON)
  }
}

describe('deterministic avatar visual loop', () => {
  it('keeps every state and customiser combination inside the frame', () => {
    for (const state of ANIMATION_STATES) {
      for (const expression of EXPRESSIONS) {
        for (const shape of SHAPES) {
          const frame = sampleAvatar({ state, expression, shape })
          expectPathInsideFrame(frame.path, `${state}/${expression}/${shape}`)

          for (const dot of frame.dots) {
            expect(Math.abs(dot.x * BODY_RADIUS) + dot.r * BODY_RADIUS, `${state} dot x`).toBeLessThanOrEqual(
              VIEW_HALF + EPSILON,
            )
            expect(Math.abs(dot.y * BODY_RADIUS) + dot.r * BODY_RADIUS, `${state} dot y`).toBeLessThanOrEqual(
              VIEW_HALF + EPSILON,
            )
          }
        }
      }
    }
  })

  it('keeps settled and in-flight morphs inside the frame', () => {
    for (const state of ANIMATION_STATES) {
      for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
        expectPathInsideFrame(sampleMorph('Idle', state, progress).path, `Idle>${state}@${progress}`)
      }
    }
  })

  it('never applies expression eyes to non-face states', () => {
    for (const state of NON_FACE_STATES) {
      for (const expression of EXPRESSIONS) {
        expect(sampleAvatar({ state, expression }).eyes, `${state}/${expression}`).toHaveLength(0)
      }
    }
  })

  it('does not leak the custom hexagon silhouette into Alert', () => {
    expect(sampleAvatar({ state: 'Idle', shape: 'hexagon' }).path).not.toBe(
      sampleAvatar({ state: 'Alert', shape: 'hexagon' }).path,
    )
  })
})
