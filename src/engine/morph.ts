/**
 * Radial-profile morphing inspired by jeremy-prt/bloub (MIT).
 * Every silhouette is r(θ) sampled at the same angles, so a morph is a lerp of radii.
 */
import { TAU, lerp, r2 } from './math'

export const PROFILE_SAMPLES = 64
export const BODY_RADIUS = 46
export const VIEW_SCALE = BODY_RADIUS
export const VIEW_CX = 0
export const VIEW_CY = 0

export interface Point {
  x: number
  y: number
}

export interface Silhouette {
  radii: number[]
  rot: number
  cx: number
  cy: number
  sx: number
  sy: number
}

const ANGLES = Array.from({ length: PROFILE_SAMPLES }, (_, i) => (i / PROFILE_SAMPLES) * TAU)
const COS = ANGLES.map((a) => Math.cos(a))
const SIN = ANGLES.map((a) => Math.sin(a))

export function circle(radius = 1, pose: Partial<Silhouette> = {}): Silhouette {
  return {
    radii: Array.from({ length: PROFILE_SAMPLES }, () => radius),
    rot: 0,
    cx: 0,
    cy: 0,
    sx: 1,
    sy: 1,
    ...pose,
  }
}

export function polarPolygon(sides: number, round = 0.18, rotation = -Math.PI / 2): number[] {
  const sector = TAU / sides
  return ANGLES.map((theta) => {
    const shifted = theta - rotation
    const a = (((shifted % sector) + sector) % sector) - sector / 2
    const r = Math.cos(Math.PI / sides) / Math.max(Math.cos(a), 1e-6)
    return lerp(1, r, 1 - round)
  })
}

export function superellipse(n: number, sx = 1, sy = 1): number[] {
  return ANGLES.map((_, i) => {
    const c = Math.abs((COS[i] ?? 0) / sx) ** n
    const s = Math.abs((SIN[i] ?? 0) / sy) ** n
    return (c + s) ** (-1 / n)
  })
}

export function silhouetteFromRadii(radii: number[], pose: Partial<Silhouette> = {}): Silhouette {
  return {
    radii: [...radii],
    rot: 0,
    cx: 0,
    cy: 0,
    sx: 1,
    sy: 1,
    ...pose,
  }
}

export function blendSilhouettes(a: Silhouette, b: Silhouette, t: number): Silhouette {
  const radii = Array.from({ length: PROFILE_SAMPLES }, (_, i) =>
    lerp(a.radii[i] ?? 1, b.radii[i] ?? 1, t),
  )
  let dRot = b.rot - a.rot
  while (dRot > Math.PI) dRot -= TAU
  while (dRot < -Math.PI) dRot += TAU
  return {
    radii,
    rot: a.rot + dRot * t,
    cx: lerp(a.cx, b.cx, t),
    cy: lerp(a.cy, b.cy, t),
    sx: lerp(a.sx, b.sx, t),
    sy: lerp(a.sy, b.sy, t),
  }
}

export const blend = blendSilhouettes

export function toPoints(s: Silhouette, scale: number): Point[] {
  const cr = Math.cos(s.rot)
  const sr = Math.sin(s.rot)
  const out: Point[] = []
  for (let i = 0; i < PROFILE_SAMPLES; i++) {
    const r = s.radii[i] ?? 1
    const x = r * (COS[i] ?? 0)
    const y = r * (SIN[i] ?? 0)
    const rx = x * cr - y * sr
    const ry = x * sr + y * cr
    out.push({
      x: (rx * s.sx + s.cx) * scale,
      y: (ry * s.sy + s.cy) * scale,
    })
  }
  return out
}

export function closedPath(pts: Point[], tension = 1 / 6): string {
  const n = pts.length
  if (n < 3) return ''
  const first = pts[0]
  if (!first) return ''
  let d = `M${r2(first.x)} ${r2(first.y)}`
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n]
    const p1 = pts[i]
    const p2 = pts[(i + 1) % n]
    const p3 = pts[(i + 2) % n]
    if (!p0 || !p1 || !p2 || !p3) continue
    const c1x = p1.x + (p2.x - p0.x) * tension
    const c1y = p1.y + (p2.y - p0.y) * tension
    const c2x = p2.x - (p3.x - p1.x) * tension
    const c2y = p2.y - (p3.y - p1.y) * tension
    d += `C${r2(c1x)} ${r2(c1y)} ${r2(c2x)} ${r2(c2y)} ${r2(p2.x)} ${r2(p2.y)}`
  }
  return `${d}Z`
}

export function viewBoxAttr(): string {
  return '-50 -50 100 100'
}

export function eggProfile(): number[] {
  return superellipse(2.2, 0.82, 1)
}

export function regularPolygonProfile(sides: number, radius = 1, rotation = -Math.PI / 2): number[] {
  return polarPolygon(sides, 0.18, rotation).map((r) => r * radius)
}

export function silhouettePath(
  s: Silhouette,
  scale = BODY_RADIUS,
  ox = VIEW_CX,
  oy = VIEW_CY,
): string {
  const pts = toPoints(s, scale)
  for (const p of pts) {
    p.x += ox
    p.y += oy
  }
  return closedPath(pts)
}
