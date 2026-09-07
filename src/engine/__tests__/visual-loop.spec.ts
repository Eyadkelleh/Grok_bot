import { describe, expect, it } from 'vitest'
import {
  ANIMATION_STATES,
  BODY_RADIUS,
  DEFAULT_MORPH_MS,
  VIEW_HALF,
  sampleAvatar,
  sampleMorph,
} from '..'
import { VISUAL_CASES, kebab, progressOf } from '../../testing/visual/cases'
import {
  assertGoldenInventory,
  expectPictureGolden,
  wantsPicture,
} from '../../testing/visual/golden'
import { samplePicture, tokenizePath } from '../../testing/visual/picture'

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

describe('visual case registry', () => {
  it('covers every animation state plus Idle→Alert and Idle→Thinking ladders', () => {
    const ids = new Set(VISUAL_CASES.map((visualCase) => visualCase.id))
    for (const state of ANIMATION_STATES) {
      expect(ids.has(kebab(state)), state).toBe(true)
    }
    for (const stop of ['p0', 'p25', 'p50', 'p75', 'p1']) {
      expect(ids.has(`idle-to-alert-${stop}`), `idle-to-alert-${stop}`).toBe(true)
      expect(ids.has(`idle-to-thinking-${stop}`), `idle-to-thinking-${stop}`).toBe(true)
    }
    expect(ids.has('idle-happy-hexagon')).toBe(true)
    expect(ids.has('wink')).toBe(true)
    expect(ids.has('wide-eyes')).toBe(true)
  })

  it('seeks Idle→Alert at 0.25 through rendAt arithmetic', () => {
    const visualCase = VISUAL_CASES.find((row) => row.id === 'idle-to-alert-p25')
    expect(visualCase?.seek).toBeDefined()
    expect(progressOf(visualCase!.seek!, DEFAULT_MORPH_MS)).toBeCloseTo(0.25, 10)
  })

  it('tokenizes silhouette paths and rejects unknown commands', () => {
    expect(tokenizePath('M1 2C3 4 5 6 7 8Z')).toEqual(['M', 1, 2, 'C', 3, 4, 5, 6, 7, 8, 'Z'])
    expect(() => tokenizePath('M0 0H10Z')).toThrow(/unknown path token/)
  })
})

describe.each(VISUAL_CASES.filter(wantsPicture))('picture $id — $what', (visualCase) => {
  it('matches the reviewed PictureFrame', async () => {
    const picture = samplePicture(visualCase)
    expect(picture.schema).toBe(1)
    expect(picture.eyes).toHaveLength(visualCase.expect.eyes)
    expect(picture.dots).toHaveLength(visualCase.expect.dots)
    if (visualCase.expect.face === 'morphing') expect(picture.eyes).toHaveLength(0)
    if (visualCase.expect.state === 'Alert') expect(picture.eyes).toHaveLength(0)
    await expectPictureGolden(picture, visualCase)
  })
})

describe('visual goldens', () => {
  it('has no orphan files', async () => {
    await assertGoldenInventory(VISUAL_CASES)
  })
})
