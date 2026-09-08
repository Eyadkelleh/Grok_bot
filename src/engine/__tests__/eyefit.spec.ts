import { describe, expect, it } from 'vitest'
import { sampleAvatar, sampleLiveMorph } from '../avatar'
import {
  EYE_FIT_FOR_TESTS,
  ZERO_EYE_OFFSET,
  blendEyeOffset,
  eyeClearance,
  eyeOffset,
} from '../eyefit'
import { EXPRESSIONS } from '../expressions'
import { easeOutQuint } from '../math'
import { BODY_RADIUS, toPoints } from '../morph'
import { SHAPES } from '../skins'
import { resolveStateGeometry } from '../authority'

const CLEARANCE_EPS = 0.05

describe('eyeOffset table', () => {
  it('leaves the circle rest face unmoved', () => {
    for (const state of EYE_FIT_FOR_TESTS.FACE_STATES) {
      for (const expression of EXPRESSIONS) {
        expect(eyeOffset('circle', state, expression.id), `${state}/${expression.id}`).toEqual(
          ZERO_EYE_OFFSET,
        )
      }
    }
  })

  it('returns zero for faceless states and unknown shapes', () => {
    expect(eyeOffset('triangle', 'Alert', 'neutral')).toEqual(ZERO_EYE_OFFSET)
    expect(eyeOffset('nope', 'Idle', 'neutral')).toEqual(ZERO_EYE_OFFSET)
  })

  it('translates a narrow wearable instead of shrinking it', () => {
    const triangle = eyeOffset('triangle', 'Idle', 'neutral')
    const cloud = eyeOffset('cloud', 'Idle', 'shy')
    expect(Math.hypot(triangle.x, triangle.y)).toBeGreaterThan(0)
    expect(Math.hypot(cloud.x, cloud.y)).toBeGreaterThan(0)
  })
})

describe('wearable rest-face eyefit', () => {
  it('keeps Idle eye radii independent of the customiser shape', () => {
    const circle = sampleAvatar({ shape: 'circle', expression: 'surprised' })
    for (const shape of SHAPES) {
      const frame = sampleAvatar({ shape: shape.id, expression: 'surprised' })
      expect(frame.eyes).toHaveLength(2)
      expect(frame.eyes[0]!.rx, shape.id).toBe(circle.eyes[0]!.rx)
      expect(frame.eyes[0]!.ry, shape.id).toBe(circle.eyes[0]!.ry)
      expect(frame.eyes[1]!.rx, shape.id).toBe(circle.eyes[1]!.rx)
      expect(frame.eyes[1]!.ry, shape.id).toBe(circle.eyes[1]!.ry)
    }
  })

  it('keeps face capsules inside every wearable silhouette', () => {
    const violations: string[] = []
    for (const shape of SHAPES) {
      for (const state of EYE_FIT_FOR_TESTS.FACE_STATES) {
        for (const expression of EXPRESSIONS) {
          const label = `${shape.id}/${state}/${expression.id}`
          const frame = sampleAvatar({ shape: shape.id, state, expression: expression.id })
          expect(frame.eyes.length, `${label}: face eye count`).toBe(2)
          const contour = toPoints(resolveStateGeometry(state, shape.id).silhouette, BODY_RADIUS)
          for (const [index, eye] of frame.eyes.entries()) {
            const clearance = eyeClearance(eye, contour)
            if (clearance < -CLEARANCE_EPS) {
              violations.push(`${label}: eye ${index} clearance ${clearance.toFixed(3)}`)
            }
          }
        }
      }
    }
    expect(violations, violations.join('\n')).toEqual([])
  })

  it('keeps rolled capsules inside a narrow wearable', () => {
    const gaze = { yaw: 12, pitch: -6, roll: 22 }
    const violations: string[] = []
    for (const shape of ['triangle', 'cloud', 'capsule'] as const) {
      const frame = sampleAvatar({ shape, state: 'Idle', expression: 'angry', gaze })
      const contour = toPoints(resolveStateGeometry('Idle', shape).silhouette, BODY_RADIUS)
      for (const [index, eye] of frame.eyes.entries()) {
        const angle = Math.atan2(eye.d, eye.c)
        expect(angle, `${shape} eye ${index} long axis`).not.toBeCloseTo(Math.PI / 2, 2)
        const clearance = eyeClearance(eye, contour)
        if (clearance < -CLEARANCE_EPS) {
          violations.push(`${shape}: eye ${index} clearance ${clearance.toFixed(3)}`)
        }
      }
    }
    expect(violations, violations.join('\n')).toEqual([])
  })

  it('interpolates table endpoints on a shape morph', () => {
    const from = eyeOffset('circle', 'Idle', 'neutral')
    const to = eyeOffset('triangle', 'Idle', 'neutral')
    const k = easeOutQuint(0.5)
    expect(blendEyeOffset(from, to, k)).toEqual({
      x: from.x + (to.x - from.x) * k,
      y: from.y + (to.y - from.y) * k,
    })
    const mid = sampleLiveMorph({
      from: 'Idle',
      to: 'Idle',
      fromShape: 'circle',
      toShape: 'triangle',
      t: 0.5,
    })
    const start = sampleAvatar({ shape: 'circle', state: 'Idle' })
    const end = sampleAvatar({ shape: 'triangle', state: 'Idle' })
    expect(mid.eyes[0]!.rx).toBe(start.eyes[0]!.rx)
    expect(mid.eyes[0]!.rx).toBe(end.eyes[0]!.rx)
  })
})
