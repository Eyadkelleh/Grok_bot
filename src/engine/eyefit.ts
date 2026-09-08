/**
 * Tabulated rest-face placement for wearable shapes.
 *
 * Eyes live on a sphere. Radial fit (`radiusAtAngle`) puts their centres on the
 * real silhouette, but a capsule still has size: a narrow body in that
 * direction leaves too little margin, and the mask cuts the pair open.
 *
 * Solving that per frame tracks live gaze, morph, and whichever edge is
 * tightest, so the pair jitters. The rest of the engine interpolates declared
 * poses. A table of isometric translations fits that mould: look-up, then
 * lerp. The solver can probe a wander envelope because it does not run in
 * `sample`.
 *
 * Offsets are in body-radius units. The sampler scales them by `BODY_RADIUS`.
 */
import { STATE_GEOMETRY, resolveStateGeometry, type FacePolicy } from './authority'
import { EXPRESSIONS, resolveExpression, type BotExpression, type EyeCfg } from './expressions'
import { eyeAxes, eyePoses, type HeadGaze } from './face'
import { BODY_RADIUS, radiusAtAngle, toPoints, type Point, type Silhouette } from './morph'
import { SHAPE_BY_ID, SHAPES } from './skins'
import { ANIMATION_STATES, STATE_REGISTRY, type AnimationState } from './states'

const R = BODY_RADIUS

/** Rest-life gaze envelope. `loopNoise` is bounded by 1, so these sums are exact. */
const WANDER_YAW = 5.5 + 1.6
const WANDER_PITCH = 4.2 + 1.3
const WANDER_X = 0.006
const WANDER_Y = 0.007
const FLOAT = Math.hypot(WANDER_X, WANDER_Y) * R

const DIRECTIONS = 12
const BISECT = 8

export interface EyeOffset {
  x: number
  y: number
}

export const ZERO_EYE_OFFSET: EyeOffset = Object.freeze({ x: 0, y: 0 })

const FACE_STATES = ANIMATION_STATES.filter((state) => STATE_GEOMETRY[state].face !== 'none')

interface Capsule {
  x: number
  y: number
  ax: number
  ay: number
  r: number
  m: [number, number, number, number]
}

interface Trial {
  capsules: Capsule[]
  reference: Capsule[]
  contour: Point[]
  circleContour: Point[]
}

export function faceEyeCfgs(face: FacePolicy, expression: BotExpression): [EyeCfg, EyeCfg] {
  const cfgs: [EyeCfg, EyeCfg] = [{ ...expression.eyes[0] }, { ...expression.eyes[1] }]
  if (face === 'wink') cfgs[1]!.open = 0.08
  if (face === 'wide') {
    for (const cfg of cfgs) {
      cfg.w *= 1.35
      cfg.h *= 1.2
    }
  }
  return cfgs
}

function capsules(
  gaze: HeadGaze,
  split: number,
  cfgs: readonly EyeCfg[],
  sil: Silhouette,
  radii: number[],
): Capsule[] {
  const out: Capsule[] = []
  const poses = eyePoses(gaze, R, split)
  for (let i = 0; i < 2; i++) {
    const e = poses[i]!
    if (e.depth <= 0.02) continue
    const cfg = cfgs[i]!
    const { a: ax, b: ay, c: cx, d: cy } = eyeAxes(e, cfg.tilt)
    const hw = Math.max(cfg.w * R, 0.01) / 2
    const hh = Math.max(cfg.h * R, 0.01) / 2
    const r = Math.min(hw, hh)
    const tall = hh > hw
    const half = tall ? hh - r : hw - r
    const fit = radiusAtAngle(radii, Math.atan2(e.y, e.x) - sil.rot)
    out.push({
      x: e.x * fit,
      y: e.y * fit,
      ax: (tall ? cx : ax) * half,
      ay: (tall ? cy : ay) * half,
      r,
      m: [ax, ay, cx, cy],
    })
  }
  return out
}

function approach(pts: Point[], x0: number, y0: number, x1: number, y1: number) {
  const sx = x1 - x0
  const sy = y1 - y0
  const len2 = sx * sx + sy * sy
  let best = Infinity
  let vx = 0
  let vy = 0
  for (const p of pts) {
    let t = len2 > 0 ? ((p.x - x0) * sx + (p.y - y0) * sy) / len2 : 0
    t = t < 0 ? 0 : t > 1 ? 1 : t
    const ex = x0 + t * sx - p.x
    const ey = y0 + t * sy - p.y
    const d2 = ex * ex + ey * ey
    if (d2 < best) {
      best = d2
      vx = ex
      vy = ey
    }
  }
  const d = Math.sqrt(best)
  return { d, ux: d > 1e-9 ? vx / d : 0, uy: d > 1e-9 ? vy / d : 0 }
}

function worst(pts: Point[], caps: Capsule[], tx: number, ty: number) {
  let margin = Infinity
  let ux = 0
  let uy = 0
  for (const e of caps) {
    const x = e.x + tx
    const y = e.y + ty
    const hit = approach(pts, x - e.ax, y - e.ay, x + e.ax, y + e.ay)
    const [m0, m1, m2, m3] = e.m
    const radius = e.r * Math.hypot(m0 * hit.ux + m1 * hit.uy, m2 * hit.ux + m3 * hit.uy) + FLOAT
    if (hit.d - radius < margin) {
      margin = hit.d - radius
      ux = hit.ux
      uy = hit.uy
    }
  }
  return { margin, ux, uy }
}

function solve(trials: Trial[]): EyeOffset {
  if (!trials.length) return ZERO_EYE_OFFSET

  const marginAt = (tx: number, ty: number) => {
    let m = Infinity
    for (const trial of trials) m = Math.min(m, worst(trial.contour, trial.capsules, tx, ty).margin)
    return m
  }

  let needed = Infinity
  for (const trial of trials) {
    needed = Math.min(needed, worst(trial.circleContour, trial.reference, 0, 0).margin)
  }

  let mx = 0
  let my = 0
  const caps = trials[0]!.capsules
  for (const e of caps) {
    mx -= e.x / caps.length
    my -= e.y / caps.length
  }
  const reach = Math.max(0.35 * R, Math.hypot(mx, my) * 1.25)
  needed = Math.min(needed, marginAt(mx, my))

  const start = marginAt(0, 0)
  if (start >= needed && start >= 0) return ZERO_EYE_OFFSET
  const target = Math.max(needed, 0)

  let bestX = 0
  let bestY = 0
  let bestNorm = Infinity
  let fallbackX = 0
  let fallbackY = 0
  let fallback = start

  for (let d = 0; d < DIRECTIONS; d++) {
    const a = (d / DIRECTIONS) * Math.PI * 2
    const ux = Math.cos(a)
    const uy = Math.sin(a)
    if (marginAt(ux * reach, uy * reach) < target) {
      for (const k of [0.3, 0.6, 1]) {
        const m = marginAt(ux * reach * k, uy * reach * k)
        if (m > fallback) {
          fallback = m
          fallbackX = ux * reach * k
          fallbackY = uy * reach * k
        }
      }
      continue
    }
    let lo = 0
    let hi = reach
    for (let i = 0; i < BISECT; i++) {
      const mid = (lo + hi) / 2
      if (marginAt(ux * mid, uy * mid) >= target) hi = mid
      else lo = mid
    }
    if (hi < bestNorm) {
      bestNorm = hi
      bestX = ux * hi
      bestY = uy * hi
    }
  }

  const x = bestNorm === Infinity ? fallbackX : bestX
  const y = bestNorm === Infinity ? fallbackY : bestY
  return { x: +(x / R).toFixed(6), y: +(y / R).toFixed(6) }
}

function offsetFor(state: AnimationState, sil: Silhouette, expression: BotExpression): EyeOffset {
  const face = STATE_GEOMETRY[state].face
  if (face === 'none') return ZERO_EYE_OFFSET
  const cfgs = faceEyeCfgs(face, expression)
  const contour = toPoints(sil, R)
  const native = STATE_REGISTRY[state].silhouette.radii
  const circleContour = toPoints({ ...sil, radii: native }, R)
  const trials: Trial[] = []
  for (const dy of [-WANDER_YAW, WANDER_YAW]) {
    for (const dp of [-WANDER_PITCH, WANDER_PITCH]) {
      const gaze: HeadGaze = {
        yaw: expression.gaze.yaw + dy,
        pitch: expression.gaze.pitch + dp,
        roll: expression.gaze.roll,
      }
      trials.push({
        capsules: capsules(gaze, expression.split, cfgs, sil, sil.radii),
        reference: capsules(gaze, expression.split, cfgs, sil, native),
        contour,
        circleContour,
      })
    }
  }
  return solve(trials)
}

function cellKey(state: AnimationState, expression: string): string {
  return `${state}|${expression}`
}

function buildTable(): Map<string, Map<string, EyeOffset>> {
  const table = new Map<string, Map<string, EyeOffset>>()
  for (const shape of SHAPES) {
    const byCell = new Map<string, EyeOffset>()
    for (const state of FACE_STATES) {
      const sil = resolveStateGeometry(state, shape.id).silhouette
      for (const expression of EXPRESSIONS) {
        byCell.set(cellKey(state, expression.id), offsetFor(state, sil, expression))
      }
    }
    table.set(shape.id, byCell)
  }
  return table
}

const OFFSETS = buildTable()

/**
 * Common translation for both eyes on this wearable rest face, in body-radius
 * units. Circle, unknown shapes, and faceless states return zero.
 */
export function eyeOffset(
  shapeId: string | undefined,
  state: AnimationState,
  expressionId?: string,
): EyeOffset {
  if (!FACE_STATES.includes(state)) return ZERO_EYE_OFFSET
  const shape = shapeId ? SHAPE_BY_ID.get(shapeId) : SHAPE_BY_ID.get('circle')
  if (!shape) return ZERO_EYE_OFFSET
  const cells = OFFSETS.get(shape.id)
  if (!cells) return ZERO_EYE_OFFSET
  const expression = resolveExpression(expressionId)
  return cells.get(cellKey(state, expression.id)) ?? ZERO_EYE_OFFSET
}

/** Lerp two table entries. Used on shape and state morphs; never re-solved. */
export function blendEyeOffset(a: EyeOffset, b: EyeOffset, t: number): EyeOffset {
  if (a === b) return b
  if (a.x === b.x && a.y === b.y) return b
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
}

/** Capsule clearance against a silhouette contour, in viewBox pixels. */
export function eyeClearance(
  eye: {
    x: number
    y: number
    rx: number
    ry: number
    a: number
    b: number
    c: number
    d: number
    tilt: number
  },
  contour: Point[],
): number {
  const { a: ax, b: ay, c: cx, d: cy } = eyeAxes(eye, eye.tilt)
  const hw = Math.max(eye.rx, 0.01) / 2
  const hh = Math.max(eye.ry, 0.01) / 2
  const r = Math.min(hw, hh)
  const tall = hh > hw
  const half = tall ? hh - r : hw - r
  const cap: Capsule = {
    x: eye.x,
    y: eye.y,
    ax: (tall ? cx : ax) * half,
    ay: (tall ? cy : ay) * half,
    r,
    m: [ax, ay, cx, cy],
  }
  return worst(contour, [cap], 0, 0).margin + FLOAT
}

export const EYE_FIT_FOR_TESTS = { buildTable, FACE_STATES }
