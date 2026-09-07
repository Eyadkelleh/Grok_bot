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
import { defaultCycle, poseCycle } from '../engine'

describe('export intent', () => {
  it('builds a morphing pose cycle so the clip is not a frozen frame', () => {
    const source = sourceFromPose('Comet')
    expect(blocksForSource(source)).toEqual([
      { state: 'Idle', duration: 0.4 },
      { state: 'Comet', duration: 1.2 },
      { state: 'Idle', duration: 0.4 },
    ])
    expect(durationForSource(source)).toBe(2)
    expect(cycleForSource(source).id).toBe('pose-Comet')
  })

  it('keeps Idle as a single settled block', () => {
    expect(poseCycle('Idle').blocks).toEqual([{ state: 'Idle', duration: 2 }])
  })

  it('keeps timeline blocks for a cycle source', () => {
    const cycle = defaultCycle()
    const source = sourceFromCycle(cycle)
    expect(blocksForSource(source)).toEqual([{ state: 'Idle', duration: 2 }])
    expect(durationForSource(source)).toBe(2)
  })

  it('discriminates still vs video intents', () => {
    expect(makeStillIntent('Idle', 'png').kind).toBe('still')
    expect(makeVideoIntent(sourceFromPose('Wink'), 'mp4').kind).toBe('video')
  })
})
