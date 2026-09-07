import { describe, expect, it } from 'vitest'
import { DEFAULT_SIZE } from '../../engine'
import { STAGE_MAX, STAGE_MIN, stageSizeOf } from '../useStageGeometry'

describe('stageSizeOf', () => {
  it('uses 72% of the short edge as an integer pixel size', () => {
    expect(stageSizeOf(800, 600)).toBe(432)
    expect(stageSizeOf(1000, 1000)).toBe(720)
  })

  it('clamps to the studio range and falls back when the box is empty', () => {
    expect(stageSizeOf(200, 200)).toBe(STAGE_MIN)
    expect(stageSizeOf(4000, 3000)).toBe(STAGE_MAX)
    expect(stageSizeOf(0, 0)).toBe(DEFAULT_SIZE)
    expect(stageSizeOf(-10, 500)).toBe(DEFAULT_SIZE)
  })
})
