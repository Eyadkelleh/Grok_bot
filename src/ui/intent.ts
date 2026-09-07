/**
 * Export intent: still vs video and pose vs cycle are first-class.
 * UI labels, duration, filename, and encoder input all derive from this.
 */

import {
  DEFAULT_BLOCK_DURATION,
  makeBlock,
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
  duration: number
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

export const DEFAULT_POSE_CLIP_DURATION = DEFAULT_BLOCK_DURATION

export function sourceFromPose(
  state: AnimationState,
  duration = DEFAULT_POSE_CLIP_DURATION,
): PoseExportSource {
  return { kind: 'pose', state, duration }
}

export function sourceFromCycle(cycle: Cycle): CycleExportSource {
  return {
    kind: 'cycle',
    cycleId: cycle.id,
    cycleName: cycle.name,
    blocks: cycle.blocks.map((b) => ({ ...b })),
  }
}

export function makeStillIntent(state: AnimationState, format: StillFormat): ExportIntent {
  return { kind: 'still', format, state }
}

export function makeVideoIntent(
  source: SourceExport,
  format: VideoFormat,
  background: FondGif = 'blanc',
): ExportIntent {
  return { kind: 'video', format, source, background }
}

export function blocksForSource(source: SourceExport): Block[] {
  if (source.kind === 'pose') return [makeBlock(source.state, source.duration)]
  return source.blocks.map((b) => ({ ...b }))
}

export function durationForSource(source: SourceExport): number {
  return totalDuration(blocksForSource(source))
}

export function cycleForSource(source: SourceExport): Cycle {
  if (source.kind === 'pose') {
    return {
      id: `pose-${source.state}`,
      name: source.state,
      blocks: blocksForSource(source),
    }
  }
  return {
    id: source.cycleId,
    name: source.cycleName,
    blocks: blocksForSource(source),
  }
}
