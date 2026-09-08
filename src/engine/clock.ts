/**
 * Clock-free avatar engine: `sample(t)` is a pure function of dated time.
 *
 * Pause, resume, and seek are different `t` inputs. Previous state and shape
 * are never purged, so replaying a date during a morph still finds it.
 *
 * M1 samples settled poses and morph-between-states only. Thinking / Orbit /
 * Burst pose(t) liveliness is M2.
 */
import { sampleAvatar, sampleLiveMorph, type AvatarFrame, type AvatarSpec } from './avatar'
import { blockAt, type Block } from './cycles'
import type { GazeInput } from './face'
import { clamp } from './math'
import { DEFAULT_SHAPE } from './skins'
import { DEFAULT_MORPH_MS, isAnimationState, type AnimationState } from './states'

export type ClockAppearance = Pick<AvatarSpec, 'expression' | 'gaze' | 'colour' | 'paper'>

function resolveState(value: string | undefined): AnimationState {
  if (value && isAnimationState(value)) return value
  return 'Idle'
}

export class AvatarEngine {
  /** Morph duration in seconds. Same floor as `DEFAULT_MORPH_MS`. */
  static readonly MORPH = DEFAULT_MORPH_MS / 1000

  morphMs: number

  private cur: AnimationState
  private prev: AnimationState | null = null
  private tCur = 0
  private shape: string
  private shapePrev: string | null = null
  private shapeAt = Number.NEGATIVE_INFINITY
  private expression: string | undefined
  private gaze: GazeInput | undefined
  private colour: string | undefined
  private paper: string | undefined

  constructor(spec: AvatarSpec = {}, morphMs = DEFAULT_MORPH_MS) {
    this.cur = resolveState(spec.state)
    this.shape = spec.shape ?? DEFAULT_SHAPE
    this.expression = spec.expression
    this.gaze = spec.gaze
    this.colour = spec.colour
    this.paper = spec.paper
    this.morphMs = morphMs
  }

  get state(): AnimationState {
    return this.cur
  }

  get shapeId(): string {
    return this.shape
  }

  setAppearance(appearance: ClockAppearance) {
    if (appearance.expression !== undefined) this.expression = appearance.expression
    if (appearance.gaze !== undefined) this.gaze = appearance.gaze
    if (appearance.colour !== undefined) this.colour = appearance.colour
    if (appearance.paper !== undefined) this.paper = appearance.paper
  }

  setState(id: AnimationState, now: number) {
    if (id === this.cur) return
    this.prev = this.cur
    this.cur = id
    this.tCur = now
  }

  setShape(shape: string, now: number) {
    if (shape === this.shape) return
    this.shapePrev = this.shape
    this.shape = shape
    this.shapeAt = now
  }

  /**
   * Land on `id` with no previous state, as a fresh engine posed there.
   * Seek to the start of a sequence must use this: `setState` keeps the
   * outgoing state for blending, which would mix the first block with the last.
   */
  reset(id: AnimationState, now: number) {
    this.cur = id
    this.prev = null
    this.tCur = now
  }

  morphingAt(t: number): boolean {
    const morphSec = this.morphSeconds()
    const stateMorphing = this.prev !== null && t - this.tCur < morphSec
    const shapeMorphing = this.shapePrev !== null && t - this.shapeAt < morphSec
    return stateMorphing || shapeMorphing
  }

  shownState(t: number): AnimationState {
    const morphSec = this.morphSeconds()
    if (this.prev !== null && t - this.tCur < morphSec) return this.prev
    return this.cur
  }

  /**
   * Pose the engine on the montage block that contains `t` and return the
   * dated sample time for that local transition. Later blocks are not kept as
   * history: export calls this per frame, and a single prev pointer cannot
   * replay an earlier joint after a later `setState`.
   */
  seek(t: number, blocks: Block[]): number {
    this.shapePrev = null
    const hit = blockAt(blocks, t)
    const current = blocks[hit.index]?.state ?? 'Idle'
    const prev = hit.index > 0 ? (blocks[hit.index - 1]?.state ?? current) : current
    const morphDone = hit.index === 0 || hit.elapsed * 1000 + 1e-6 >= this.morphMs
    if (morphDone) {
      this.reset(current, 0)
      return this.morphMs > 0 ? this.morphMs / 1000 : 1
    }
    this.reset(prev, 0)
    this.setState(current, 0)
    return hit.elapsed
  }

  sample(t: number, appearance: ClockAppearance = {}): AvatarFrame {
    const spec = this.specAt(appearance)
    const morphSec = this.morphSeconds()
    const sinceState = t - this.tCur
    const sinceShape = t - this.shapeAt
    const stateMorphing = this.prev !== null && sinceState < morphSec
    const shapeMorphing = this.shapePrev !== null && sinceShape < morphSec

    if (!stateMorphing && !shapeMorphing) {
      return sampleAvatar({ ...spec, state: this.cur, shape: this.shape })
    }

    const linear = stateMorphing
      ? clamp(sinceState / Math.max(morphSec, 1e-12))
      : clamp(sinceShape / Math.max(morphSec, 1e-12))

    return sampleLiveMorph({
      ...spec,
      from: stateMorphing ? this.prev! : this.cur,
      to: this.cur,
      fromShape: shapeMorphing ? this.shapePrev! : this.shape,
      toShape: this.shape,
      t: linear,
    })
  }

  private morphSeconds(): number {
    return this.morphMs <= 0 ? 0 : this.morphMs / 1000
  }

  private specAt(appearance: ClockAppearance): AvatarSpec {
    return {
      expression: appearance.expression ?? this.expression,
      gaze: appearance.gaze ?? this.gaze,
      colour: appearance.colour ?? this.colour,
      paper: appearance.paper ?? this.paper,
    }
  }
}

/** Throwaway engine: settled or morphing sample at dated `t` with no setters. */
export function sampleAt(t: number, spec: AvatarSpec = {}, morphMs = DEFAULT_MORPH_MS): AvatarFrame {
  return new AvatarEngine(spec, morphMs).sample(t)
}
