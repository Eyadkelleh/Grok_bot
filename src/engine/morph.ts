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
export const VIEW_HALF = BODY_RADIUS * 1.58
export const VIEW_SIZE = VIEW_HALF * 2

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

/** Linearly sample a radial profile at any angle. */
export function radiusAtAngle(radii: number[], angle: number): number {
  if (radii.length === 0) return 0
  const turn = ((angle / TAU) % 1 + 1) % 1
  const sample = turn * radii.length
  const lo = Math.floor(sample)
  const hi = (lo + 1) % radii.length
  return lerp(radii[lo] ?? 0, radii[hi] ?? 0, sample - lo)
}

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

/** Radial profile of a polygon by casting rays from `(cx, cy)` at each sample angle. */
export function profileFromPolygon(poly: Point[], cx = 0, cy = 0): number[] {
  const radii = new Array<number>(PROFILE_SAMPLES).fill(0)
  const n = poly.length
  for (let k = 0; k < PROFILE_SAMPLES; k++) {
    const dx = COS[k] ?? 0
    const dy = SIN[k] ?? 0
    let best = 0
    for (let i = 0; i < n; i++) {
      const a = poly[i]!
      const b = poly[(i + 1) % n]!
      const ex = b.x - a.x
      const ey = b.y - a.y
      const den = dx * ey - dy * ex
      if (Math.abs(den) < 1e-9) continue
      const px = a.x - cx
      const py = a.y - cy
      const t = (px * ey - py * ex) / den
      const u = (px * dy - py * dx) / den
      if (t > best && u >= 0 && u <= 1) best = t
    }
    radii[k] = best
  }
  return radii
}

/** Convex hull of two discs (external common tangents + arcs). */
export function hullOfCircles(
  x1: number,
  y1: number,
  r1: number,
  x2: number,
  y2: number,
  r2: number,
  steps = 96,
): Point[] {
  const dx = x2 - x1
  const dy = y2 - y1
  const dist = Math.hypot(dx, dy) || 1e-6
  const base = Math.atan2(dy, dx)
  const spread = Math.acos(Math.max(-1, Math.min(1, (r1 - r2) / dist)))
  const pts: Point[] = []
  for (let i = 0; i <= steps / 2; i++) {
    const a = base + spread + ((TAU - 2 * spread) * i) / (steps / 2)
    pts.push({ x: x1 + Math.cos(a) * r1, y: y1 + Math.sin(a) * r1 })
  }
  for (let i = 0; i <= steps / 2; i++) {
    const a = base - spread + (2 * spread * i) / (steps / 2)
    pts.push({ x: x2 + Math.cos(a) * r2, y: y2 + Math.sin(a) * r2 })
  }
  return pts
}

/**
 * Rounded polygon via Minkowski sum with a disc. Vertices sit at `radius - rc`;
 * clockwise winding with screen y-down.
 */
function roundedPolygon(verts: Point[], rc: number, arcSteps = 10): Point[] {
  const n = verts.length
  const out: Point[] = []
  const normal = (a: Point, b: Point) => {
    const dx = b.x - a.x
    const dy = b.y - a.y
    const len = Math.hypot(dx, dy) || 1
    return Math.atan2(-dx / len, dy / len)
  }
  for (let i = 0; i < n; i++) {
    const prev = verts[(i - 1 + n) % n]!
    const cur = verts[i]!
    const next = verts[(i + 1) % n]!
    const a0 = normal(prev, cur)
    const a1 = normal(cur, next)
    let d = a1 - a0
    while (d > Math.PI) d -= TAU
    while (d < -Math.PI) d += TAU
    for (let k = 0; k <= arcSteps; k++) {
      const a = a0 + (d * k) / arcSteps
      out.push({ x: cur.x + Math.cos(a) * rc, y: cur.y + Math.sin(a) * rc })
    }
  }
  return out
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
  return `${-VIEW_HALF} ${-VIEW_HALF} ${VIEW_SIZE} ${VIEW_SIZE}`
}

export function eggProfile(): number[] {
  return superellipse(2.2, 0.82, 1)
}

/**
 * Regular polygon with rounded corners, inscribed in `radius`.
 * `rc` is corner radius; `rotationDeg` is clockwise with screen y-down
 * (`-90` puts a triangle tip up).
 */
export function regularPolygonProfile(
  sides: number,
  radius = 1,
  rc = 0.18,
  rotationDeg = -90,
): number[] {
  const rot = (rotationDeg * Math.PI) / 180
  const verts = Array.from({ length: sides }, (_, i) => {
    const a = rot + (i / sides) * TAU
    return { x: Math.cos(a) * (radius - rc), y: Math.sin(a) * (radius - rc) }
  })
  return profileFromPolygon(roundedPolygon(verts, rc), 0, 0)
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
