/**
 * Measured Burst / Comet décor: elliptical orbit arcs split in depth, and
 * Burst specks that spiral into the core. Numbers from bloub `decor.ts` (MIT).
 *
 * Arc geometry stays in body-radius units. The avatar rasterises paths into
 * viewBox pixels so states never need the scale.
 */
import { clamp, createRng, r2, TAU } from './math'
import { BODY_RADIUS } from './morph'

export interface DecorDot {
  x: number
  y: number
  r: number
  opacity: number
  depth?: number
}

function wheel(hue: number, s = 0.55, l = 0.62): string {
  const h = ((hue % 360) + 360) % 360
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  const [r, g, b] =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x]
  const hex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, '0')
  return `#${hex(r)}${hex(g)}${hex(b)}`
}

export interface ArcSeed {
  a: number
  k: number
  tilt: number
  speed: number
  phase: number
  sweep: number
  hue: number
  hueSpan: number
  width: number
  cx: number
  cy: number
}

export interface ArcSpec {
  id: string
  seed: ArcSeed
  t: number
  opacity: number
}

export interface ArcRender {
  id: string
  front: string
  back: string
  width: number
  opacity: number
  grad: { x1: number; y1: number; x2: number; y2: number; stops: string[] }
}

/**
 * Orthographic 3D circle. z < 0 is the back half, drawn before the body so the
 * silhouette occludes it. That split is what reads as an orbit, not a flat ring.
 */
export function arcRender(seed: ArcSeed, t: number, scale: number, id: string, opacity = 1): ArcRender {
  const spin = seed.phase + t * seed.speed * TAU
  const cu = Math.cos(seed.tilt)
  const su = Math.sin(seed.tilt)
  const kz = Math.sqrt(Math.max(0, 1 - seed.k * seed.k))

  const n = 64
  const span = seed.sweep * TAU
  let front = ''
  let back = ''
  let prev: boolean | null = null

  for (let i = 0; i <= n; i++) {
    const th = spin + (i / n) * span
    const ct = Math.cos(th)
    const st = Math.sin(th)
    const x = seed.a * (ct * cu + st * -su * seed.k) + seed.cx
    const y = seed.a * (ct * su + st * cu * seed.k) + seed.cy
    const z = seed.a * st * kz

    const behind = z < 0
    const sx = r2(x * scale)
    const sy = r2(y * scale)
    const cmd = behind !== prev ? 'M' : 'L'
    if (behind) back += `${cmd}${sx} ${sy}`
    else front += `${cmd}${sx} ${sy}`
    prev = behind
  }

  const gx = Math.cos(seed.tilt) * seed.a * scale
  const gy = Math.sin(seed.tilt) * seed.a * scale
  return {
    id,
    front,
    back,
    width: seed.width * scale,
    opacity,
    grad: {
      x1: r2(seed.cx * scale - gx),
      y1: r2(seed.cy * scale - gy),
      x2: r2(seed.cx * scale + gx),
      y2: r2(seed.cy * scale + gy),
      stops: [wheel(seed.hue), wheel(seed.hue + seed.hueSpan * 0.5), wheel(seed.hue + seed.hueSpan)],
    },
  }
}

export function rasterizeArcs(specs: readonly ArcSpec[], scale = BODY_RADIUS): ArcRender[] {
  return specs
    .filter((spec) => spec.opacity > 0.01)
    .map((spec) => arcRender(spec.seed, spec.t, scale, spec.id, spec.opacity))
}

const RING_RNG = createRng(0xa11ce)

/** Six rings, semi-major 1.30–1.40, flatten ≤ 0.45, ~3.3 turns/s. */
export const RINGS: ArcSeed[] = Array.from({ length: 6 }, (_, i) => ({
  a: 1.3 + RING_RNG() * 0.1,
  k: 0.05 + RING_RNG() * 0.4,
  tilt: (i / 6) * Math.PI + RING_RNG() * 0.5,
  speed: 3 + RING_RNG() * 0.7,
  phase: RING_RNG() * TAU,
  sweep: 0.6 + RING_RNG() * 0.25,
  hue: (i * 360) / 6 + RING_RNG() * 30,
  hueSpan: 60 + RING_RNG() * 60,
  width: 0.05 + RING_RNG() * 0.012,
  cx: 0,
  cy: 0.1,
}))

/** Nested hairpin arcs, rmax 1.37, seen almost edge-on. */
export const SWOOSH: ArcSeed[] = Array.from({ length: 4 }, (_, i) => ({
  a: 0.78 + i * 0.2,
  k: 0.05 + i * 0.02,
  tilt: -0.62 + i * 0.05,
  speed: 0.3,
  phase: 0.06 * i,
  sweep: 0.4,
  hue: 95 + i * 62,
  hueSpan: 100,
  width: 0.05,
  cx: 0,
  cy: -0.12,
}))

const P_RNG = createRng(0xbeef)

const PARTICLES = Array.from({ length: 5 }, (_, i) => ({
  birth: i * 0.2,
  angle: P_RNG() * TAU,
  rho: 0.58 + P_RNG() * 0.18,
}))

/** Rest snapshot so the still Burst dump is not a lone circle. */
export const BURST_REST_T = 0.25

/** Mid-ribbon date so the still Comet dump shows the tail. */
export const COMET_REST_T = 0.5

/**
 * Specks spiral inward (radius ×0.75 per 0.1 s, +100°/s) and grow, then pass
 * behind the core. Coordinates are body-radius units when scale is 1.
 */
export function particles(t: number, scale = 1): DecorDot[] {
  const out: DecorDot[] = []
  for (const p of PARTICLES) {
    const u = t - p.birth
    if (u < 0 || u > 0.62) continue
    const rho = p.rho * 0.75 ** (u * 10)
    const a = p.angle + (u * 100 * Math.PI) / 180
    const opacity = clamp(u / 0.06) * clamp((0.62 - u) / 0.08)
    if (opacity <= 0.01) continue
    out.push({
      x: Math.cos(a) * rho * scale,
      y: Math.sin(a) * rho * scale,
      r: (0.04 + 0.028 * clamp(u / 0.55)) * scale,
      depth: clamp(1 - rho / 0.8),
      opacity,
    })
  }
  return out
}

export function burstParticles(t: number): DecorDot[] {
  return particles(Math.max(t, BURST_REST_T), 1)
}

const COMET_RNG = createRng(0xc0e7)

/** Four ribbons, a = 0.85, b = 0.15, tilt +34°, ~210°/s. */
export const COMET_RIBBONS: ArcSeed[] = Array.from({ length: 4 }, (_, i) => {
  const d = i - 1.5
  return {
    a: 0.85 * (1 + d * 0.03),
    k: (0.15 / 0.85) * (1 + d * 0.16),
    tilt: (34 * Math.PI) / 180 + d * 0.035,
    speed: 210 / 360,
    phase: -i * 0.045 + COMET_RNG() * 0.012,
    sweep: 0.34,
    hue: i * 85 + COMET_RNG() * 20,
    hueSpan: 80,
    width: 0.095,
    cx: 0,
    cy: 0,
  }
})

export const COMET_DOT = 0.129

export function cometFade(t: number): number {
  return clamp((t - 0.15) / 0.25) * clamp((1.95 - t) / 0.3)
}

export function cometArcSpecs(t: number): ArcSpec[] {
  const u = Math.max(t, COMET_REST_T)
  const opacity = cometFade(u)
  return COMET_RIBBONS.map((seed, i) => ({
    id: `cm${i}`,
    seed,
    t: u,
    opacity,
  }))
}

export function blendArcs(a: ArcRender[], b: ArcRender[], k: number): ArcRender[] {
  const out = 1 - k
  return [
    ...a.map((arc) => ({ ...arc, id: `a${arc.id}`, opacity: arc.opacity * out })),
    ...b.map((arc) => ({ ...arc, id: `b${arc.id}`, opacity: arc.opacity * k })),
  ].filter((arc) => arc.opacity > 0.01)
}
