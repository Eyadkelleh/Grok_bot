/**
 * Export intent: still vs video and pose vs cycle are first-class.
 * UI labels, duration, filename, and encoder input all derive from this.
 */

import {
  poseCycle,
  totalDuration,
  type AnimationState,
  type Block,
  type Cycle,
} from '../engine'
import { type FormatCycle, type FondGif } from './export'

export type StillFormat = 'png' | 'svg'
export type VideoFormat = FormatCycle
export type VideoSourceKind = 'pose' | 'cycle'

export interface PoseExportSource {
  kind: 'pose'
  state: AnimationState
}

export interface CycleExportSource {
  kind: 'cycle'
  cycleId: string
  cycleName: string
  blocks: readonly Block[]
}

export type SourceExport = PoseExportSource | CycleExportSource

export type ExportIntent =
  | {
      kind: 'still'
      format: StillFormat
      state: AnimationState
    }
  | {
      kind: 'video'
      format: VideoFormat
      source: SourceExport
      background: FondGif
    }

/** Total length of a pose-as-video clip (Idle lead + hold + Idle return). */
export const DEFAULT_POSE_CLIP_DURATION = 2

export function sourceFromPose(state: AnimationState): PoseExportSource {
  return { kind: 'pose', state }
}

export function sourceFromCycle(cycle: Cycle): CycleExportSource {
  return {
    kind: 'cycle',
    cycleId: cycle.id,
    cycleName: cycle.name,
    blocks: cycle.blocks.map((b) => ({ ...b })),
  }
}

export function makeStillIntent(
  state: AnimationState,
  format: StillFormat,
): Extract<ExportIntent, { kind: 'still' }> {
  return { kind: 'still', format, state }
}

export function makeVideoIntent(
  source: SourceExport,
  format: VideoFormat,
  background: FondGif = 'blanc',
): Extract<ExportIntent, { kind: 'video' }> {
  return { kind: 'video', format, source, background }
}

export function blocksForSource(source: SourceExport): Block[] {
  if (source.kind === 'pose') return poseCycle(source.state).blocks.map((b) => ({ ...b }))
  return source.blocks.map((b) => ({ ...b }))
}

export function durationForSource(source: SourceExport): number {
  return totalDuration(blocksForSource(source))
}

export function cycleForSource(source: SourceExport): Cycle {
  if (source.kind === 'pose') {
    const cycle = poseCycle(source.state)
    return {
      id: `pose-${source.state}`,
      name: source.state,
      blocks: cycle.blocks.map((b) => ({ ...b })),
    }
  }
  return {
    id: source.cycleId,
    name: source.cycleName,
    blocks: blocksForSource(source),
  }
}
