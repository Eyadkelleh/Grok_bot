import {
  ANIMATION_STATES,
  blockAt,
  DEFAULT_MORPH_MS,
  makeBlock,
  morphProgress,
  morphSecondsOf,
  resolveStateGeometry,
  sampleAvatar,
  sampleLiveMorph,
  type AnimationState,
  type Block,
} from '../../engine'
import type { GoldenKind, Seek, VisualCase, VisualExpectation } from './types'

const CASE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const LADDER_STOPS = [0, 0.25, 0.5, 0.75, 1] as const
const LADDERS = [
  ['Idle', 'Alert'],
  ['Idle', 'Thinking'],
] as const satisfies ReadonlyArray<readonly [AnimationState, AnimationState]>
const BLOCK_S = 2

export function kebab(id: string): string {
  return id.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
}

export function block(state: AnimationState, duration = BLOCK_S): Block {
  return makeBlock(state, duration)
}

export function progressOf(seek: Seek, durationMs: number): number {
  const hit = blockAt([...seek.blocks], seek.at)
  if (hit.index === 0) return 1
  return morphProgress(hit.elapsed * 1000, durationMs)
}

export function defineVisualCases(cases: VisualCase[]): VisualCase[] {
  const ids = new Set<string>()
  for (const visualCase of cases) {
    if (!CASE_ID.test(visualCase.id)) throw new Error(`bad visual case id: ${visualCase.id}`)
    if (ids.has(visualCase.id)) throw new Error(`duplicate visual case id: ${visualCase.id}`)
    ids.add(visualCase.id)
  }
  return cases
}

function stopId(progress: number): string {
  if (progress === 0) return 'p0'
  if (progress === 1) return 'p1'
  return `p${Math.round(progress * 100)}`
}

function settledExpect(state: AnimationState, shape?: string): VisualExpectation {
  const frame = sampleAvatar({ state, shape })
  const geometry = resolveStateGeometry(state, shape)
  const isFace = geometry.face !== 'none'
  return {
    face: isFace ? 'pictures' : 'glyph',
    state,
    eyes: frame.eyes.length,
    dots: frame.dots.length,
    silhouette: geometry.shapeApplied
      ? { kind: 'shape', shape: frame.shape }
      : { kind: 'state', state },
  }
}

function settledGolden(state: AnimationState): GoldenKind {
  if (state === 'Idle' || state === 'Wink' || state === 'WideEyes') return 'both'
  return 'picture'
}

function settledCase(state: AnimationState): VisualCase {
  const isFace = sampleAvatar({ state }).eyes.length > 0
  return {
    id: kebab(state),
    what: isFace ? `${state} is a face with two eyes` : `${state} is a glyph with no eyes`,
    props: { state, durationMs: 0 },
    expect: settledExpect(state),
    golden: settledGolden(state),
  }
}

function morphSeek(from: AnimationState, to: AnimationState, progress: number): Seek {
  return {
    blocks: [block(from), block(to)],
    at: BLOCK_S + progress * morphSecondsOf(to),
  }
}

function morphGolden(to: AnimationState, progress: number): GoldenKind {
  if (progress === 0 || progress === 1) return 'none'
  if (to === 'Alert' && progress === 0.25) return 'both'
  return 'picture'
}

function morphCase(from: AnimationState, to: AnimationState, progress: number): VisualCase {
  const settled = progress >= 1
  const live = sampleLiveMorph({ from, to, t: progress })
  const expect: VisualExpectation = settled
    ? { ...settledExpect(to), target: to }
    : {
        face: 'morphing',
        state: from,
        target: to,
        eyes: live.eyes.length,
        dots: live.dots.length,
        silhouette: { kind: 'morph', from, to, progress },
      }
  return {
    id: `${kebab(from)}-to-${kebab(to)}-${stopId(progress)}`,
    what: settled
      ? `Idle→${to} lands on ${to}`
      : `Idle→${to} at ${progress} fades eyes and interpolates the body`,
    props: { durationMs: DEFAULT_MORPH_MS },
    seek: morphSeek(from, to, progress),
    expect,
    golden: morphGolden(to, progress),
  }
}

const generated: VisualCase[] = [
  ...ANIMATION_STATES.map(settledCase),
  ...LADDERS.flatMap(([from, to]) => LADDER_STOPS.map((progress) => morphCase(from, to, progress))),
]

const curated: VisualCase[] = [
  {
    id: 'idle-happy-hexagon',
    what: 'Idle wears the hexagon body and happy eyes',
    props: { state: 'Idle', shape: 'hexagon', expression: 'happy', durationMs: 0 },
    expect: settledExpect('Idle', 'hexagon'),
    golden: 'both',
  },
  {
    id: 'alert-happy-hexagon',
    what: 'Alert keeps the italic glyph and ignores hexagon and expression',
    props: { state: 'Alert', shape: 'hexagon', expression: 'happy', durationMs: 0 },
    expect: settledExpect('Alert', 'hexagon'),
    golden: 'picture',
  },
]

export const VISUAL_CASES = defineVisualCases([...generated, ...curated])
