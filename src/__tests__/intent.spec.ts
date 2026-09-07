import { describe, expect, it } from 'vitest'
import {
  blocksForSource,
  cycleForSource,
  durationForSource,
  makeStillIntent,
  makeVideoIntent,
  sourceFromCycle,
  sourceFromPose,
} from '../ui/intent'
import { defaultCycle } from '../engine'

describe('export intent', () => {
  it('builds a one-block cycle from a pose', () => {
    const source = sourceFromPose('Comet')
    expect(blocksForSource(source)).toEqual([{ state: 'Comet', duration: 2 }])
    expect(durationForSource(source)).toBe(2)
    expect(cycleForSource(source).id).toBe('pose-Comet')
  })

  it('keeps timeline blocks for a cycle source', () => {
    const cycle = defaultCycle()
    const source = sourceFromCycle(cycle)
    expect(blocksForSource(source)).toHaveLength(cycle.blocks.length)
    expect(durationForSource(source)).toBe(28)
  })

  it('discriminates still vs video intents', () => {
    expect(makeStillIntent('Idle', 'png').kind).toBe('still')
    expect(makeVideoIntent(sourceFromPose('Wink'), 'mp4').kind).toBe('video')
  })
})
