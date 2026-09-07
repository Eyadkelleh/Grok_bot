import { blinkScale, eyePoses, resolveGaze, type GazeInput, type HeadGaze } from './face'
import { resolveExpression, type ExpressionId } from './expressions'
import {
  BODY_RADIUS,
  radiusAtAngle,
  silhouetteFromRadii,
  silhouettePath,
  viewBoxAttr,
} from './morph'
import { resolveColour, resolveShape, type ColorId, type ShapeId } from './skins'
import {
  isAnimationState,
  silhouetteFor,
  STATE_REGISTRY,
  type AnimationState,
  type MorphDot,
} from './states'

/** Customiser shape replaces the body on rest-like faces only. */
const SHAPE_STATES = new Set<AnimationState>(['Idle', 'Wink', 'WideEyes', 'Notification'])
const FACE_STATES = new Set<AnimationState>([
  'Idle',
  'Wink',
  'WideEyes',
  'Notification',
])

export interface AvatarSpec {
  size?: number
  shape?: string
  expression?: string
  gaze?: GazeInput
  colour?: string
  state?: string
  paper?: string
}

export interface AvatarEye {
  x: number
  y: number
  rx: number
  ry: number
  a: number
  b: number
  c: number
  d: number
  tilt: number
  opacity: number
}

export interface AvatarFrame {
  path: string
  fill: string
  paper: string
  eyes: AvatarEye[]
  dots: MorphDot[]
  shape: ShapeId
  expression: ExpressionId
  colour: string
  gaze: HeadGaze
  state: AnimationState
  viewBox: string
}

export const DEFAULT_SIZE = 220
export const DEFAULT_PAPER = '#f5f5f4'

function resolveState(value: string | undefined): AnimationState {
  if (value && isAnimationState(value)) return value
  return 'Idle'
}

function eyesFor(
  state: AnimationState,
  expressionId: string | undefined,
  gaze: GazeInput | undefined,
  radii: number[],
): { eyes: AvatarEye[]; gaze: HeadGaze; expression: ExpressionId } {
  const expression = resolveExpression(expressionId)
  const resolved = resolveGaze(expression.gaze, gaze)
  if (!FACE_STATES.has(state)) {
    return { eyes: [], gaze: resolved, expression: expression.id }
  }

  const cfgs = [
    { ...expression.eyes[0] },
    { ...expression.eyes[1] },
  ]
  if (state === 'Wink') cfgs[1]!.open = 0.08
  if (state === 'WideEyes') {
    for (const cfg of cfgs) {
      cfg.w *= 1.35
      cfg.h *= 1.2
    }
  }
  const poses = eyePoses(resolved, BODY_RADIUS, expression.split)
  const eyes: AvatarEye[] = poses.map((pose, i) => {
    const cfg = cfgs[i]!
    const lid = blinkScale(cfg.open)
    return {
      x: pose.x,
      y: pose.y,
      rx: cfg.w * BODY_RADIUS,
      ry: cfg.h * BODY_RADIUS * lid,
      a: pose.a,
      b: pose.b,
      c: pose.c,
      d: pose.d,
      tilt: cfg.tilt,
      opacity: pose.depth > 0.04 ? 1 : 0,
    }
  })

  const margin = 1
  for (const eye of eyes) {
    const factor = radiusAtAngle(radii, Math.atan2(eye.y, eye.x))
    eye.x *= factor
    eye.y *= factor
  }

  let commonEyeScale = 1
  for (const eye of eyes) {
    const edge = radiusAtAngle(radii, Math.atan2(eye.y, eye.x)) * BODY_RADIUS
    const effectiveRadius = Math.max(eye.rx, eye.ry) * 0.6
    if (effectiveRadius > 0) {
      commonEyeScale = Math.min(commonEyeScale, Math.max(0, (edge - margin) / effectiveRadius))
    }
  }
  for (const eye of eyes) {
    eye.rx *= commonEyeScale
    eye.ry *= commonEyeScale
  }

  let commonOffset = 0
  for (const eye of eyes) {
    const distance = Math.hypot(eye.x, eye.y)
    const edge = radiusAtAngle(radii, Math.atan2(eye.y, eye.x)) * BODY_RADIUS
    const effectiveRadius = Math.max(eye.rx, eye.ry) * 0.6
    commonOffset = Math.max(commonOffset, distance + effectiveRadius + margin - edge)
  }
  if (commonOffset > 0) {
    for (const eye of eyes) {
      const distance = Math.hypot(eye.x, eye.y)
      const scale = distance > 0 ? Math.max(0, distance - commonOffset) / distance : 0
      eye.x *= scale
      eye.y *= scale
    }
  }

  return { eyes, gaze: resolved, expression: expression.id }
}

export function sampleAvatar(spec: AvatarSpec = {}): AvatarFrame {
  const state = resolveState(spec.state)
  const shape = resolveShape(spec.shape)
  const fill = resolveColour(spec.colour)
  const paper = spec.paper ?? DEFAULT_PAPER
  const silhouette = SHAPE_STATES.has(state)
    ? silhouetteFromRadii(shape.radii)
    : silhouetteFor(state)
  const { eyes, gaze, expression } = eyesFor(state, spec.expression, spec.gaze, silhouette.radii)
  const dots = FACE_STATES.has(state) ? [] : STATE_REGISTRY[state].dots

  return {
    path: silhouettePath(silhouette),
    fill,
    paper,
    eyes,
    dots,
    shape: shape.id,
    expression,
    colour: fill,
    gaze,
    state,
    viewBox: viewBoxAttr(),
  }
}

export function gazeAttr(gaze: HeadGaze): string {
  return `${gaze.yaw},${gaze.pitch},${gaze.roll}`
}

export function colourIdOf(specColour: string | undefined, fill: string): ColorId | string {
  return specColour && !specColour.startsWith('#') ? specColour : fill
}
