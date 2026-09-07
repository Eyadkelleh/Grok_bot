import { describe, expect, it } from 'vitest'
import { BASE_SCALE, clampZoom, MAX_ZOOM, MIN_ZOOM, mmss, ticksFor } from '../timeline'

describe('timeline scale', () => {
  it('formats a clock without tenths', () => {
    expect(mmss(0)).toBe('0:00')
    expect(mmss(4.9)).toBe('0:04')
    expect(mmss(65)).toBe('1:05')
  })

  it('clamps the loupe and spaces ruler ticks', () => {
    expect(clampZoom(0)).toBe(MIN_ZOOM)
    expect(clampZoom(9)).toBe(MAX_ZOOM)
    const ticks = ticksFor(10, BASE_SCALE)
    expect(ticks[0]).toEqual({ t: 0, major: true })
    expect(ticks.some((tick) => tick.t === 10 && tick.major)).toBe(true)
    expect(ticks.length).toBeGreaterThan(4)
  })
})
