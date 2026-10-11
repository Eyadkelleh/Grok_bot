/**
 * Measured "!" glyphs: a tapered upright bar, a constant-width italic capsule,
 * and a teardrop period for the leaning mark.
 */
import { hullOfCircles, polyPath, profileFromPolygon, type Silhouette } from './morph'

/** Profile origin of the upright bar, halfway between the two generating circles. */
export const BAR_UPRIGHT_CY = -0.1875

/** Italic "!" tilt, 17.7°, matching the video rest pose. */
export const ALERT_TILT = (17.7 * Math.PI) / 180

/** Italic bar centre, body-radius units. */
export const ALERT_BAR_CY = -0.325

/** Distance from italic bar centre to the teardrop along the glyph axis. */
export const ALERT_DOT_ALONG = 0.58

/**
 * Upright "!" stem: convex hull of two discs.
 * Top (0, -0.505) r 0.132, bottom (0, 0.13) r 0.075, straight flanks.
 * Taper ratio top/bottom = 1.76.
 */
export const BAR_UPRIGHT_RADII = profileFromPolygon(
  hullOfCircles(0, -0.505, 0.132, 0, 0.13, 0.075),
  0,
  BAR_UPRIGHT_CY,
)

/** Italic "!" stem: capsule of constant width 0.269 and length 0.776. */
export const BAR_ITALIC_RADII = profileFromPolygon(
  hullOfCircles(0, -0.2535, 0.1345, 0, 0.2535, 0.1345),
  0,
  0,
)

/**
 * Italic period: round end r 0.118 toward the bar, tapered tip opposite,
 * length 0.300 along the glyph axis. Origin is the round end's centre.
 */
export const TEAR_PATH = polyPath(hullOfCircles(0, 0, 0.118, 0, 0.172, 0.012))

function fromRadii(radii: readonly number[], pose: Partial<Silhouette> = {}): Silhouette {
  return { radii: [...radii], rot: 0, cx: 0, cy: 0, sx: 1, sy: 1, ...pose }
}

export function barUpright(pose: Partial<Silhouette> = {}): Silhouette {
  return fromRadii(BAR_UPRIGHT_RADII, { cy: BAR_UPRIGHT_CY, ...pose })
}

export function barItalic(pose: Partial<Silhouette> = {}): Silhouette {
  return fromRadii(BAR_ITALIC_RADII, pose)
}
