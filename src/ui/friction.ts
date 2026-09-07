/**
 * Frozen usability ruler for video creation (issue #33).
 * Higher score = more friction. Hillclimb keeps only changes that lower this
 * without failing the regression gate. Do not edit weights mid-run.
 */

export const FRICTION_VERSION = 1

export interface FrictionFlags {
  /** GIF/MP4 labels or groups name cycle/montage, not just "Download GIF". */
  montageLabeled: boolean
  /** Export UI shows active cycle duration before download. */
  durationShown: boolean
  /** Export UI names the active cycle. */
  cycleNamed: boolean
  /** A control exports or loops the current palette pose as video. */
  poseVideoPath: boolean
  /** Animation palette fill uses the selected colour (not only currentColor). */
  paletteUsesColour: boolean
  /** New cycle's first block matches the selected animation state. */
  newCycleFromPose: boolean
  /** Timeline + control names the state it will append. */
  addNamesState: boolean
  /** Busy export shows an exporting status string (not silent disable). */
  busyStatus: boolean
  /** MP4 is hidden or disabled when VideoEncoder is unavailable. */
  mp4Gated: boolean
  /** Default cycle total duration is a short clip, not a full catalogue. */
  saneDefaultDuration: boolean
}

export const FRICTION_WEIGHTS: Record<keyof FrictionFlags, number> = {
  montageLabeled: 3,
  durationShown: 2,
  cycleNamed: 2,
  poseVideoPath: 3,
  paletteUsesColour: 1,
  newCycleFromPose: 2,
  addNamesState: 1,
  busyStatus: 1,
  mp4Gated: 1,
  saneDefaultDuration: 2,
}

export function scoreFriction(flags: FrictionFlags): number {
  let total = 0
  for (const key of Object.keys(FRICTION_WEIGHTS) as (keyof FrictionFlags)[]) {
    if (!flags[key]) total += FRICTION_WEIGHTS[key]
  }
  return total
}

export function maxFriction(): number {
  return Object.values(FRICTION_WEIGHTS).reduce((a, b) => a + b, 0)
}
