import { clamp } from './math'

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
