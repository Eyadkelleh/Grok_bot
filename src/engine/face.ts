import { clamp, createRng, loopNoise } from './math'

type Vec3 = [number, number, number]

/** Half-split of the eyes on the sphere, in degrees. */
export const EYE_SPLIT = 15.46
/** Rest eye size, in body-radius units. */
export const EYE_W = 0.186
export const EYE_H = 0.412

export interface HeadGaze {
  /** Yaw in degrees; positive looks right. */
  yaw: number
  /** Pitch in degrees; positive looks up. */
  pitch: number
  /** Roll in degrees; head tilt. */
  roll: number
}

/** Rest pose measured off the Grok-style reference. */
export const REST_GAZE: HeadGaze = { yaw: 28.49, pitch: 28.62, roll: -13 }

export interface EyePose {
  x: number
  y: number
  a: number
  b: number
  c: number
  d: number
  depth: number
}

export type GazeInput = number | Partial<HeadGaze>

function deg(d: number): number {
  return (d * Math.PI) / 180
}

function spin(u: Vec3, v: Vec3, angle: number): [Vec3, Vec3] {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  return [
    [u[0] * c + v[0] * s, u[1] * c + v[1] * s, u[2] * c + v[2] * s],
    [v[0] * c - u[0] * s, v[1] * c - u[1] * s, v[2] * c - u[2] * s],
  ]
}

/**
 * Tangent frames for both eyes on a sphere. Index 0 is the inner eye.
 * Screen space: x right, y down, z toward the viewer.
 */
export function eyePoses(gaze: HeadGaze, scale: number, split = EYE_SPLIT): [EyePose, EyePose] {
  let f: Vec3 = [0, 0, 1]
  let right: Vec3 = [1, 0, 0]
  let down: Vec3 = [0, 1, 0]

  ;[f, right] = spin(f, right, deg(gaze.yaw))
  ;[down, f] = spin(down, f, deg(gaze.pitch))
  ;[right, down] = spin(right, down, deg(gaze.roll))

  const build = (side: number): EyePose => {
    const [ef, er] = spin(f, right, deg(split * side))
    return {
      x: ef[0] * scale,
      y: ef[1] * scale,
      a: er[0],
      b: er[1],
      c: down[0],
      d: down[1],
      depth: ef[2],
    }
  }

  return [build(-1), build(1)]
}

export function resolveGaze(base: HeadGaze, gaze?: GazeInput): HeadGaze {
  if (gaze == null) return { ...base }
  if (typeof gaze === 'number') return { ...base, yaw: gaze }
  return {
    yaw: gaze.yaw ?? base.yaw,
    pitch: gaze.pitch ?? base.pitch,
    roll: gaze.roll ?? base.roll,
  }
}

export function blinkScale(lid: number): number {
  return 0.06 + 0.94 * clamp(lid)
}

/**
 * Forced blink that masks a blinkIn morph. Same triangle as bloub (`elapsed / 0.2`):
 * open at the ends, shut at mid-phase. Grok feeds morph progress so the lids
 * cover the silhouette change at the morph midpoint.
 */
export function forcedBlinkLid(phase: number): number {
  const k = clamp(phase)
  return k < 1 ? Math.abs(k * 2 - 1) : 1
}

/**
 * Rest-face life: gaze drift, blinks, and a tiny body float.
 *
 * Pure in t — pause, resume, and seek to the same date yield the same frame.
 * Deltas are added to the current state's rest pose. Default wander/blink/float
 * at the avatar layer stay off so L0 Idle dumps remain the still frame.
 */
export interface Liveliness {
  dYaw: number
  dPitch: number
  dRoll: number
  /** 1 = open, 0 = shut. Applied as vertical squash after the tangent frame. */
  lid: number
  driftX: number
  driftY: number
  breath: number
}

export interface LivelinessOptions {
  wander?: number
  blink?: boolean
  float?: boolean
}

export const STILL_LIFE: Liveliness = {
  dYaw: 0,
  dPitch: 0,
  dRoll: 0,
  lid: 1,
  driftX: 0,
  driftY: 0,
  breath: 1,
}

const BLINK_RNG = createRng(0x5eed)
/** Pre-rolled blink starts: deterministic, no runtime state. First blink at 1.4 s. */
const BLINKS: number[] = (() => {
  const out: number[] = []
  let t = 1.4
  while (t < 900) {
    out.push(t)
    t += 1.9 + BLINK_RNG() * 2.7
    if (BLINK_RNG() < 0.18) {
      out.push(t)
      t += 0.24
    }
  }
  return out
})()

/** About one to two frames at 10 fps. */
const BLINK_DUR = 0.18

/** Peak body float in rest-ball radii. Matches the bloub rest envelope. */
export const LIFE_DRIFT_X = 0.006
export const LIFE_DRIFT_Y = 0.007

function blinkLid(t: number): number {
  for (let i = 0; i < BLINKS.length; i++) {
    const start = BLINKS[i]!
    if (t < start) break
    const k = (t - start) / BLINK_DUR
    if (k >= 0 && k <= 1) {
      return k < 0.45 ? 1 - k / 0.45 : (k - 0.45) / 0.55
    }
  }
  return 1
}

export function liveliness(t: number, opt: LivelinessOptions = {}): Liveliness {
  const { wander = 1, blink = true, float = true } = opt

  return {
    dYaw: wander === 0 ? 0 : (loopNoise(t, 11.3, 0.4) * 5.5 + loopNoise(t, 3.7, 2.1) * 1.6) * wander,
    dPitch: wander === 0 ? 0 : (loopNoise(t, 9.1, 1.3) * 4.2 + loopNoise(t, 4.3, 0.7) * 1.3) * wander,
    dRoll: wander === 0 ? 0 : loopNoise(t, 13.7, 3.2) * 2.2 * wander,
    lid: blink ? blinkLid(t) : 1,
    driftX: float ? loopNoise(t, 7.9, 1.9) * LIFE_DRIFT_X : 0,
    driftY: float ? loopNoise(t, 5.3, 0.3) * LIFE_DRIFT_Y : 0,
    breath: float ? 1 + Math.sin((t / 3.4) * Math.PI * 2) * 0.005 : 1,
  }
}
