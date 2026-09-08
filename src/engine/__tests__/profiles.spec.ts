import { describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import { BODY_RADIUS, eggProfile, pathForState, regularPolygonProfile, STATE_REGISTRY } from '..'
import { PROFILE_SAMPLES, PROFILES, type ProfileName } from '../profiles'

const UP = Math.round((3 / 4) * PROFILE_SAMPLES) % PROFILE_SAMPLES
const RIGHT = 0

const LOCKED: Record<ProfileName, { i: number; r: number }[]> = {
  egg: [
    { i: 0, r: 0.8369 },
    { i: 16, r: 0.9555 },
    { i: 48, r: 1.0481 },
  ],
  hexagon: [
    { i: 0, r: 0.921 },
    { i: 5, r: 1.0059 },
    { i: 48, r: 1.0226 },
  ],
  triangle: [
    { i: 0, r: 0.7819 },
    { i: 6, r: 1.1401 },
    { i: 49, r: 1.1171 },
  ],
}

const PATH_SHA256 = {
  Egg: '0c9fbf8a5d62dc39',
  Hexagon: '732986e0ef9c77ea',
  Play: 'edec230f4b5a4fa0',
} as const

function pathHash(d: string): string {
  return createHash('sha256').update(d).digest('hex').slice(0, 16)
}

function footprint(d: string) {
  const xs: number[] = []
  const ys: number[] = []
  const head = /^M(-?[\d.]+) (-?[\d.]+)/.exec(d)
  if (head) {
    xs.push(+head[1]!)
    ys.push(+head[2]!)
  }
  for (const seg of d.matchAll(/C[-\d. ]+? (-?[\d.]+) (-?[\d.]+)(?=C|Z)/g)) {
    xs.push(+seg[1]!)
    ys.push(+seg[2]!)
  }
  return {
    w: (Math.max(...xs) - Math.min(...xs)) / BODY_RADIUS,
    h: (Math.max(...ys) - Math.min(...ys)) / BODY_RADIUS,
  }
}

describe('measured radial profiles', () => {
  it('stores 64 samples per video-measured silhouette', () => {
    expect(PROFILE_SAMPLES).toBe(64)
    for (const name of Object.keys(PROFILES) as ProfileName[]) {
      expect(PROFILES[name]).toHaveLength(PROFILE_SAMPLES)
      expect(PROFILES[name].every((r) => r > 0 && Number.isFinite(r))).toBe(true)
    }
  })

  it('locks radius samples to the measured tables', () => {
    for (const name of Object.keys(LOCKED) as ProfileName[]) {
      for (const { i, r } of LOCKED[name]) {
        expect(PROFILES[name][i], `${name}[${i}]`).toBe(r)
      }
    }
  })

  it('drives Egg, Hexagon, and Play from those tables, not analytic shortcuts', () => {
    expect(STATE_REGISTRY.Egg.silhouette.radii).toEqual([...PROFILES.egg])
    expect(STATE_REGISTRY.Hexagon.silhouette.radii).toEqual([...PROFILES.hexagon])
    expect(STATE_REGISTRY.Play.silhouette.radii).toEqual([...PROFILES.triangle])
    expect(STATE_REGISTRY.Egg.silhouette.radii).not.toEqual(eggProfile())
    expect(STATE_REGISTRY.Hexagon.silhouette.radii).not.toEqual(regularPolygonProfile(6, 1, 0.18, -90))
    expect(STATE_REGISTRY.Play.silhouette.radii).not.toEqual(regularPolygonProfile(3, 1, 0.18, -90))
  })

  it('keeps the egg as tall as the rest ball and narrower', () => {
    const { w, h } = footprint(pathForState('Egg'))
    expect(Math.abs(w - 1.653)).toBeLessThan(0.06)
    expect(Math.abs(h - 2.0)).toBeLessThan(0.06)
    expect(w).toBeLessThan(h)
  })

  it('keeps the hexagon tip-up near the measured footprint', () => {
    const { w, h } = footprint(pathForState('Hexagon'))
    expect(Math.abs(w - 1.82)).toBeLessThan(0.07)
    expect(Math.abs(h - 2.01)).toBeLessThan(0.07)
  })

  it('keeps Play wider than tall, tip up', () => {
    const { w, h } = footprint(pathForState('Play'))
    expect(w).toBeGreaterThan(h)
    expect(Math.abs(w - 1.99)).toBeLessThan(0.08)
    expect(PROFILES.triangle[UP]!).toBeGreaterThan(PROFILES.triangle[RIGHT]!)
  })

  it('locks settled path hashes so a table edit fails loudly', () => {
    expect({
      Egg: pathHash(pathForState('Egg')),
      Hexagon: pathHash(pathForState('Hexagon')),
      Play: pathHash(pathForState('Play')),
    }).toEqual(PATH_SHA256)
  })
})
