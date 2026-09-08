/**
 * Intra-state pose(t). Idle is identity so L0 settled Idle stays a still dump.
 *
 * Motion is in the spirit of bloub `states.ts` pose functions: Thinking pulse,
 * Sleep bounce, Orbit spin/relax, Burst collapse, Comet wobble. Glyph states
 * (Alert / Exclamation) stay on the static registry — K4 owns those paths.
 *
 * pose(0) matches STATE_REGISTRY so palette thumbnails and durationMs=0
 * snapshots stay the still frame.
 */
import { clamp, easeInOutCubic, easeOutQuint, TAU } from './math'
import { circle, regularPolygonProfile, type Silhouette } from './morph'
import { STATE_REGISTRY, type AnimationState, type MorphDot, type StateEntry } from './states'

const THINK_R = 0.22
const THINK_X = 0.62
const THINK_PEAK = 1.25

const SLEEP_R = 0.16
const SLEEP_CY = 0.12
const SLEEP_PERIOD = 0.6
const SLEEP_BOUNCE = 0.19
/** Slow nod so sample(0.3) and sample(1.2) do not alias on the 0.6 s bounce. */
const SLEEP_NOD = 0.04

const TRI_ORBIT = 0.213
const ORBIT_RADII = regularPolygonProfile(3, 1, 0.18, -90)
const ORBIT_SPIN = 1.25
const ORBIT_REST_ROT = 0.4

const BURST_CORE = 0.18
const COMET_CORE = 0.2
const COMET_CY = 0.04

/** Five deterministic burst specks: staggered births, no RNG. */
const BURST_PARTICLES = [
  { birth: 0, angle: 0.42, rho: 0.62 },
  { birth: 0.2, angle: 1.88, rho: 0.71 },
  { birth: 0.4, angle: 3.51, rho: 0.58 },
  { birth: 0.6, angle: 4.92, rho: 0.74 },
  { birth: 0.8, angle: 5.7, rho: 0.65 },
] as const

function entry(silhouette: Silhouette, dots: MorphDot[] = []): StateEntry {
  return { silhouette, dots }
}

function thinkingWave(t: number): number {
  return 0.5 - 0.5 * Math.cos(t * (TAU / 1.5))
}

function thinkingPose(t: number): StateEntry {
  const peak = THINK_PEAK - 1
  const mid = thinkingWave(t)
  const left = thinkingWave(t * 1.15)
  const right = thinkingWave(t * 0.85)
  return entry(circle(THINK_R * (1 + peak * mid)), [
    { x: -THINK_X, y: 0, r: THINK_R * (1 + peak * left), opacity: 1 - 0.45 * left },
    { x: THINK_X, y: 0, r: THINK_R * (1 + peak * right), opacity: 1 - 0.45 * right },
  ])
}

function sleepPose(t: number): StateEntry {
  const bounce = Math.sin(t * (TAU / SLEEP_PERIOD)) * SLEEP_BOUNCE
  const nod = Math.sin(t) * SLEEP_NOD
  return entry(circle(SLEEP_R, { cy: SLEEP_CY + bounce + nod }))
}

function spinningTriangle(rot: number): Silhouette {
  return {
    radii: [...ORBIT_RADII],
    rot,
    cx: -TRI_ORBIT * Math.sin(rot),
    cy: TRI_ORBIT * Math.cos(rot),
    sx: 1,
    sy: 1,
  }
}

function orbitPose(t: number): StateEntry {
  const ramp = easeInOutCubic(clamp(t / 0.35))
  const rot = ORBIT_REST_ROT - TAU * ORBIT_SPIN * t * ramp
  const back = easeInOutCubic(clamp((t - 1.6) / 0.9))
  const tri = spinningTriangle(rot)
  const ball = circle(1, { rot })
  return entry({
    radii: tri.radii.map((r, i) => r + ((ball.radii[i] ?? 1) - r) * back),
    rot,
    cx: tri.cx * ramp * (1 - back),
    cy: tri.cy * ramp * (1 - back),
    sx: 1,
    sy: 1,
  })
}

function burstDots(t: number): MorphDot[] {
  const out: MorphDot[] = []
  for (const p of BURST_PARTICLES) {
    const u = t - p.birth
    if (u < 0 || u > 0.62) continue
    const rho = p.rho * 0.75 ** (u * 10)
    const a = p.angle + (u * 100 * Math.PI) / 180
    const opacity = clamp(u / 0.06) * clamp((0.62 - u) / 0.08)
    if (opacity <= 0.01) continue
    out.push({
      x: Math.cos(a) * rho,
      y: Math.sin(a) * rho,
      r: 0.04 + 0.028 * clamp(u / 0.55),
      opacity,
    })
  }
  return out
}

function burstPose(t: number): StateEntry {
  const squeeze = 1 - 0.55 * easeOutQuint(clamp(t / 0.7))
  const regrow = easeOutQuint(clamp((t - 1.7) / 0.7))
  const radius = BURST_CORE * squeeze + (1 - BURST_CORE) * regrow
  return entry(circle(radius), burstDots(t))
}

function cometPose(t: number): StateEntry {
  const squeeze = 1 - 0.35 * easeOutQuint(clamp(t / 0.55))
  const regrow = easeOutQuint(clamp((t - 1.85) / 0.6))
  return entry(
    circle(COMET_CORE * squeeze + (1 - COMET_CORE) * regrow, {
      cy: COMET_CY + Math.sin(clamp(t / 1.7) * Math.PI) * 0.035,
    }),
  )
}

export function poseAt(state: AnimationState, t: number): StateEntry {
  switch (state) {
    case 'Thinking':
      return thinkingPose(t)
    case 'Sleep':
      return sleepPose(t)
    case 'Orbit':
      return orbitPose(t)
    case 'Burst':
      return burstPose(t)
    case 'Comet':
      return cometPose(t)
    default:
      return STATE_REGISTRY[state]
  }
}
