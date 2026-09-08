import { describe, expect, it } from 'vitest'
import {
  BODY_RADIUS,
  BURST_REST_T,
  COMET_REST_T,
  COMET_RIBBONS,
  RINGS,
  SWOOSH,
  arcRender,
  burstParticles,
  cometArcSpecs,
  particles,
  poseAt,
  sampleAvatar,
  STATE_GEOMETRY,
  STATE_REGISTRY,
  usesCustomiserShape,
} from '..'

describe('decor measurements', () => {
  it('keeps RINGS larger than the ball and flattened on the edge', () => {
    expect(RINGS).toHaveLength(6)
    for (const ring of RINGS) {
      expect(ring.a).toBeGreaterThanOrEqual(1.3)
      expect(ring.a).toBeLessThanOrEqual(1.4)
      expect(ring.k).toBeLessThanOrEqual(0.45)
      expect(ring.width).toBeGreaterThan(0.04)
      expect(ring.width).toBeLessThan(0.07)
    }
  })

  it('nests SWOOSH arcs edge-on under rmax 1.37', () => {
    expect(SWOOSH).toHaveLength(4)
    expect(Math.max(...SWOOSH.map((s) => s.a))).toBeCloseTo(1.38)
    for (const arc of SWOOSH) {
      expect(arc.k).toBeLessThanOrEqual(0.12)
      expect(arc.sweep).toBe(0.4)
    }
  })

  it('splits an orbit into front and back path halves', () => {
    const arc = arcRender(RINGS[0]!, 1.4, BODY_RADIUS, 'rg0', 1)
    expect(arc.back.length).toBeGreaterThan(0)
    expect(arc.front.length).toBeGreaterThan(0)
    expect(arc.back.startsWith('M') || arc.front.startsWith('M')).toBe(true)
    expect(arc.grad.stops).toHaveLength(3)
    expect(arc.grad.stops.every((stop) => /^#[0-9a-f]{6}$/.test(stop))).toBe(true)
  })

  it('spirals Burst specks inward', () => {
    const rho = (t: number) => {
      const d = particles(t)[0]
      return d ? Math.hypot(d.x, d.y) : 0
    }
    expect(rho(0.15)).toBeGreaterThan(rho(0.45))
    expect(rho(0.45)).toBeGreaterThan(0)
    expect(burstParticles(0)).toEqual(particles(BURST_REST_T))
  })

  it('holds four comet ribbons at rest so the still dump is not a lone circle', () => {
    expect(COMET_RIBBONS).toHaveLength(4)
    const rest = cometArcSpecs(0)
    expect(rest).toHaveLength(4)
    expect(rest.every((spec) => spec.t === COMET_REST_T && spec.opacity > 0.5)).toBe(true)
  })
})

describe('Burst and Comet décor', () => {
  it('settles Burst with specks behind the wearable core', () => {
    const rest = sampleAvatar({ state: 'Burst' })
    const posed = sampleAvatar({ state: 'Burst', t: 0.8 })
    expect(rest.geometryKind).toBe('wearable')
    expect(usesCustomiserShape('Burst')).toBe(true)
    expect(STATE_GEOMETRY.Burst.kind).toBe('wearable')
    expect(rest.dots.length).toBeGreaterThan(0)
    expect(rest.dotsBehind).toBe(true)
    expect(posed.dots.length).toBeGreaterThan(0)
    expect(posed.dotsBehind).toBe(true)
    expect(posed.path).not.toBe(sampleAvatar({ state: 'Idle' }).path)
    expect(poseAt('Burst', 0).dots).toEqual(STATE_REGISTRY.Burst.dots)
    expect(poseAt('Burst', 0).dotsBehind).toBe(true)
  })

  it('settles Comet with ribbon arcs in front of and behind the wearable core', () => {
    const rest = sampleAvatar({ state: 'Comet' })
    const posed = sampleAvatar({ state: 'Comet', t: 0.8 })
    expect(rest.geometryKind).toBe('wearable')
    expect(usesCustomiserShape('Comet')).toBe(true)
    expect(rest.arcs.length).toBe(4)
    expect(posed.arcs.length).toBe(4)
    expect(posed.arcs.some((arc) => arc.back.length > 0)).toBe(true)
    expect(posed.arcs.some((arc) => arc.front.length > 0)).toBe(true)
    expect(poseAt('Comet', 0).arcs).toEqual(STATE_REGISTRY.Comet.arcs)
    expect(sampleAvatar({ state: 'Idle' }).arcs).toEqual([])
    expect(sampleAvatar({ state: 'Idle' }).dotsBehind).toBe(false)
  })

  it('replays the same Burst specks and Comet ribbons at a date', () => {
    expect(sampleAvatar({ state: 'Burst', t: 0.4 }).dots).toEqual(sampleAvatar({ state: 'Burst', t: 0.4 }).dots)
    expect(sampleAvatar({ state: 'Comet', t: 0.8 }).arcs).toEqual(sampleAvatar({ state: 'Comet', t: 0.8 }).arcs)
  })
})
