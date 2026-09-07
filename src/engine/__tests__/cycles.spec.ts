import { describe, expect, it } from 'vitest'
import { ANIMATION_STATES } from '../states'
import {
  DEFAULT_BLOCK_DURATION,
  DEFAULT_CYCLE_ID,
  MAX_BLOCK,
  MAX_BLOCS,
  MIN_BLOCK,
  STEP,
  blockAt,
  blocksWith,
  clampDuration,
  defaultCycle,
  defaultMontage,
  makeBlock,
  moveBlock,
  nextCycleId,
  offsetOf,
  parseCycles,
  parseMontage,
  poseCycle,
  serializeMontage,
  totalDuration,
  uniqueName,
} from '../cycles'

describe('cycles', () => {
  it('builds a short default montage (Idle only)', () => {
    const cycle = defaultCycle()
    expect(cycle.id).toBe(DEFAULT_CYCLE_ID)
    expect(cycle.name).toBe('')
    expect(cycle.blocks).toEqual([makeBlock('Idle')])
    expect(totalDuration(cycle.blocks)).toBe(DEFAULT_BLOCK_DURATION)
  })

  it('still exposes the full catalogue via ANIMATION_STATES for builders', () => {
    expect(ANIMATION_STATES.length).toBeGreaterThan(1)
  })

  it('clamps durations onto the step between the morph floor and the editor ceiling', () => {
    expect(clampDuration('Idle', 0)).toBe(MIN_BLOCK)
    expect(clampDuration('Idle', 99)).toBe(MAX_BLOCK)
    expect(clampDuration('Idle', 1.24)).toBe(1.2)
    expect(clampDuration('Idle', 1.26)).toBe(1.3)
    expect(MIN_BLOCK).toBeGreaterThanOrEqual(STEP)
  })

  it('finds the playing block and wraps past the end', () => {
    const blocks = [makeBlock('Idle', 2), makeBlock('Thinking', 1), makeBlock('Comet', 2)]
    expect(blockAt(blocks, 0)).toEqual({ index: 0, elapsed: 0 })
    expect(blockAt(blocks, 2)).toEqual({ index: 1, elapsed: 0 })
    expect(blockAt(blocks, 2.4).index).toBe(1)
    expect(blockAt(blocks, 2.4).elapsed).toBeCloseTo(0.4)
    expect(blockAt(blocks, 5)).toEqual({ index: 0, elapsed: 0 })
    expect(blockAt(blocks, -0.6).index).toBe(2)
    expect(blockAt(blocks, -0.6).elapsed).toBeCloseTo(1.4)
    expect(blockAt([], 1)).toEqual({ index: 0, elapsed: 0 })
    expect(offsetOf(blocks, 2)).toBe(3)
  })

  it('reorders, appends, and refuses a last-block overflow', () => {
    const blocks = [makeBlock('Idle'), makeBlock('Thinking'), makeBlock('Comet')]
    expect(moveBlock(blocks, 0, 2).map((b) => b.state)).toEqual(['Thinking', 'Comet', 'Idle'])
    expect(blocksWith(blocks, 'Wink').map((b) => b.state)).toEqual(['Idle', 'Thinking', 'Comet', 'Wink'])
    const full = Array.from({ length: MAX_BLOCS }, () => makeBlock('Idle'))
    expect(blocksWith(full, 'Comet')).toHaveLength(MAX_BLOCS)
  })

  it('names cycles uniquely and issues unused ids', () => {
    const cycles = [{ id: 'c1', name: 'My cycle', blocks: [makeBlock('Idle')] }]
    expect(uniqueName('My cycle', cycles)).toBe('My cycle 2')
    expect(nextCycleId(cycles)).toBe('c2')
    expect(nextCycleId([])).toBe('c1')
  })

  it('rejects hostile storage and keeps a playable montage', () => {
    expect(parseCycles(null)).toEqual([])
    expect(parseCycles('not json')).toEqual([])
    expect(parseCycles('{"no":"blocks"}')).toEqual([])
    const raw = serializeMontage({
      activeId: 'c1',
      cycles: [
        { id: 'c1', name: 'A', blocks: [{ state: 'Idle', duration: 2 }] },
        { id: 'c1', name: 'dup', blocks: [{ state: 'Comet', duration: 2 }] },
        { id: 'c2', name: 'B', blocks: [{ state: 'nope' as never, duration: 2 }] },
      ],
    })
    const montage = parseMontage(raw)
    expect(montage.activeId).toBe('c1')
    expect(montage.cycles).toHaveLength(1)
    expect(montage.cycles[0]?.blocks[0]?.state).toBe('Idle')
  })

  it('falls back to the default montage when storage is empty', () => {
    const montage = parseMontage(null)
    expect(montage).toEqual(defaultMontage())
  })

  it('builds a morphing pose cycle for video export', () => {
    expect(poseCycle('Idle').blocks).toEqual([{ state: 'Idle', duration: 2 }])
    expect(poseCycle('Comet').blocks).toEqual([
      { state: 'Idle', duration: 0.4 },
      { state: 'Comet', duration: 1.2 },
      { state: 'Idle', duration: 0.4 },
    ])
    expect(totalDuration(poseCycle('Comet').blocks)).toBe(2)
  })
})
