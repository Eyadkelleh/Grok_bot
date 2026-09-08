import {
  ALERT_BAR_CY,
  ALERT_DOT_ALONG,
  ALERT_TILT,
  TEAR_PATH,
  barItalic,
  barUpright,
} from './glyphs'
import { clamp, easeOutQuint, lerp } from './math'
import {
  BODY_RADIUS,
  blend,
  circle,
  regularPolygonProfile,
  silhouettePath,
  type Silhouette,
} from './morph'
import { PROFILES } from './profiles'

export const ANIMATION_STATES = [
  'Idle',
  'Thinking',
  'Wink',
  'WideEyes',
  'Alert',
  'Notification',
  'Exclamation',
  'Sleep',
  'Egg',
  'Hexagon',
  'Play',
  'Orbit',
  'Burst',
  'Comet',
] as const

export type AnimationState = (typeof ANIMATION_STATES)[number]

export const DEFAULT_MORPH_MS = 400

export interface MorphDot {
  x: number
  y: number
  r: number
  opacity: number
  /** Non-circular mark in body-radius units, centred on the origin. When set, `r` is the round-end radius. */
  d?: string
  /** Rotation of `d`, in degrees. */
  rot?: number
}

export interface StateEntry {
  silhouette: Silhouette
  dots: MorphDot[]
  /** True: the arriving morph is masked by a blink, as in the reference video. */
  blinkIn?: boolean
}

export interface MorphFrame {
  path: string
  dots: MorphDot[]
  from: AnimationState
  to: AnimationState
  progress: number
}

const orbitTriangleRadii = regularPolygonProfile(3, 1, 0.18, -90)

function entry(silhouette: Silhouette, dots: MorphDot[] = [], blinkIn = false): StateEntry {
  return { silhouette, dots, blinkIn }
}

function fromRadii(radii: readonly number[], pose: Partial<Silhouette> = {}): Silhouette {
  return { radii: [...radii], rot: 0, cx: 0, cy: 0, sx: 1, sy: 1, ...pose }
}

export const STATE_REGISTRY: Record<AnimationState, StateEntry> = {
  Idle: entry(circle(1)),
  Thinking: entry(
    circle(0.22),
    [
      { x: -0.62, y: 0, r: 0.22, opacity: 1 },
      { x: 0.62, y: 0, r: 0.22, opacity: 1 },
    ],
    true,
  ),
  Wink: entry(circle(1), [], true),
  WideEyes: entry(circle(1), [], true),
  Alert: entry(barItalic({ rot: ALERT_TILT, cy: ALERT_BAR_CY }), [
    {
      x: -Math.sin(ALERT_TILT) * ALERT_DOT_ALONG,
      y: ALERT_BAR_CY + Math.cos(ALERT_TILT) * ALERT_DOT_ALONG,
      r: 0.118,
      d: TEAR_PATH,
      rot: (ALERT_TILT * 180) / Math.PI,
      opacity: 1,
    },
  ]),
  Notification: entry(circle(1), [], true),
  Exclamation: entry(barUpright(), [{ x: -0.012, y: 0.526, r: 0.113, opacity: 1 }]),
  Sleep: entry(circle(0.16, { cy: 0.12 })),
  Egg: entry(fromRadii(PROFILES.egg), [], true),
  Hexagon: entry(fromRadii(PROFILES.hexagon), [], true),
  Play: entry(fromRadii(PROFILES.triangle), [], true),
  Orbit: entry(fromRadii(orbitTriangleRadii, { rot: 0.4 })),
  Burst: entry(circle(0.18)),
  Comet: entry(circle(0.2, { cy: 0.04 })),
}

/** True when the arriving state's shape morph should be hidden by a blink. */
export function blinksIn(state: AnimationState): boolean {
  return STATE_REGISTRY[state].blinkIn === true
}

export const STATE_SILHOUETTES = Object.fromEntries(
  ANIMATION_STATES.map((id) => [id, STATE_REGISTRY[id].silhouette]),
) as Record<AnimationState, Silhouette>

export function isAnimationState(value: string): value is AnimationState {
  return (ANIMATION_STATES as readonly string[]).includes(value)
}

export function silhouetteFor(state: AnimationState): Silhouette {
  return STATE_REGISTRY[state].silhouette
}

export function morphSilhouette(from: AnimationState, to: AnimationState, t: number): Silhouette {
  return blend(STATE_REGISTRY[from].silhouette, STATE_REGISTRY[to].silhouette, t)
}

export function morphPath(from: AnimationState, to: AnimationState, t: number): string {
  return silhouettePath(morphSilhouette(from, to, t))
}

export function pathForState(state: AnimationState): string {
  return morphPath(state, state, 1)
}

export function morphProgress(elapsed: number, durationMs: number): number {
  if (durationMs <= 0) return 1
  return clamp(elapsed / durationMs)
}

export function blendDots(a: MorphDot[], b: MorphDot[], t: number): MorphDot[] {
  const n = Math.max(a.length, b.length)
  const out: MorphDot[] = []
  for (let i = 0; i < n; i++) {
    const da = a[i]
    const db = b[i]
    if (da && db) {
      const blended: MorphDot = {
        x: lerp(da.x, db.x, t),
        y: lerp(da.y, db.y, t),
        r: lerp(da.r, db.r, t),
        opacity: lerp(da.opacity, db.opacity, t),
      }
      const path = t >= 0.5 ? db.d ?? da.d : da.d ?? db.d
      if (path) blended.d = path
      if (da.rot != null || db.rot != null) blended.rot = lerp(da.rot ?? 0, db.rot ?? 0, t)
      out.push(blended)
    } else if (db) {
      out.push({ ...db, r: db.r * Math.max(t, 0.001), opacity: db.opacity * t })
    } else if (da) {
      out.push({ ...da, r: da.r * Math.max(1 - t, 0.001), opacity: da.opacity * (1 - t) })
    }
  }
  return out.filter((d) => d.opacity > 0.01)
}

export function sampleMorph(from: AnimationState, to: AnimationState, t: number): MorphFrame {
  const k = easeOutQuint(clamp(t))
  const a = STATE_REGISTRY[from]
  const b = STATE_REGISTRY[to]
  return {
    path: silhouettePath(blend(a.silhouette, b.silhouette, k), BODY_RADIUS, 0, 0),
    dots: blendDots(a.dots, b.dots, k),
    from,
    to,
    progress: t,
  }
}
