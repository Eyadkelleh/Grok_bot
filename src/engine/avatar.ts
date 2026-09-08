import { resolveStateGeometry, type FacePolicy } from './authority'
import {
  blendEyeOffset,
  eyeOffset,
  faceEyeCfgs,
  type EyeOffset,
} from './eyefit'
import { resolveExpression, type ExpressionId } from './expressions'
import { blinkScale, eyePoses, resolveGaze, type GazeInput, type HeadGaze } from './face'
import { clamp, easeOutQuint } from './math'
import {
  BODY_RADIUS,
  blend,
  radiusAtAngle,
  type Silhouette,
  silhouettePath,
  viewBoxAttr,
} from './morph'
import { resolveColour, resolveShape, type ColorId, type ShapeId } from './skins'
import { blendDots, isAnimationState, type AnimationState, type MorphDot } from './states'

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
  shapeApplied: boolean
  geometryKind: 'wearable' | 'symbol'
}

export interface LiveMorphSpec extends Omit<AvatarSpec, 'state'> {
  from: AnimationState
  to: AnimationState
  fromShape?: string
  toShape?: string
  t: number
}

export const DEFAULT_SIZE = 220
export const DEFAULT_PAPER = '#f5f5f4'

function resolveState(value: string | undefined): AnimationState {
  if (value && isAnimationState(value)) return value
  return 'Idle'
}

function showsFace(face: FacePolicy): boolean {
  return face !== 'none'
}

function eyesFor(
  face: FacePolicy,
  expressionId: string | undefined,
  gaze: GazeInput | undefined,
  silhouette: Silhouette,
  offset: EyeOffset,
): { eyes: AvatarEye[]; gaze: HeadGaze; expression: ExpressionId } {
  const expression = resolveExpression(expressionId)
  const resolved = resolveGaze(expression.gaze, gaze)
  if (!showsFace(face)) {
    return { eyes: [], gaze: resolved, expression: expression.id }
  }

  const cfgs = faceEyeCfgs(face, expression)
  const poses = eyePoses(resolved, BODY_RADIUS, expression.split)
  const shiftX = offset.x * BODY_RADIUS
  const shiftY = offset.y * BODY_RADIUS
  const eyes: AvatarEye[] = poses.map((pose, i) => {
    const cfg = cfgs[i]!
    const lid = blinkScale(cfg.open)
    const fit = radiusAtAngle(silhouette.radii, Math.atan2(pose.y, pose.x) - silhouette.rot)
    return {
      x: pose.x * fit + shiftX,
      y: pose.y * fit + shiftY,
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

  return { eyes, gaze: resolved, expression: expression.id }
}

export function activeSilhouette(state: AnimationState, shapeId?: string): Silhouette {
  return resolveStateGeometry(state, shapeId).silhouette
}

export function sampleAvatar(spec: AvatarSpec = {}): AvatarFrame {
  const state = resolveState(spec.state)
  const shape = resolveShape(spec.shape)
  const fill = resolveColour(spec.colour)
  const paper = spec.paper ?? DEFAULT_PAPER
  const geometry = resolveStateGeometry(state, shape.id)
  const { eyes, gaze, expression } = eyesFor(
    geometry.face,
    spec.expression,
    spec.gaze,
    geometry.silhouette,
    eyeOffset(shape.id, state, spec.expression),
  )

  return {
    path: silhouettePath(geometry.silhouette),
    fill,
    paper,
    eyes,
    dots: geometry.dots,
    shape: shape.id,
    expression,
    colour: fill,
    gaze,
    state,
    viewBox: viewBoxAttr(),
    shapeApplied: geometry.shapeApplied,
    geometryKind: geometry.kind,
  }
}

export function sampleLiveMorph(spec: LiveMorphSpec): AvatarFrame {
  const shape = resolveShape(spec.toShape ?? spec.shape)
  const fill = resolveColour(spec.colour)
  const k = easeOutQuint(clamp(spec.t))
  const fromGeometry = resolveStateGeometry(spec.from, spec.fromShape ?? spec.shape)
  const toGeometry = resolveStateGeometry(spec.to, spec.toShape ?? spec.shape)
  const silhouette = blend(fromGeometry.silhouette, toGeometry.silhouette, k)
  const fromFace = showsFace(fromGeometry.face)
  const toFace = showsFace(toGeometry.face)
  const eyeFace = toFace ? toGeometry.face : fromGeometry.face
  const fromShape = spec.fromShape ?? spec.shape
  const toShape = spec.toShape ?? spec.shape
  const offset = blendEyeOffset(
    eyeOffset(fromShape, spec.from, spec.expression),
    eyeOffset(toShape, spec.to, spec.expression),
    k,
  )
  const eyeFrame = eyesFor(eyeFace, spec.expression, spec.gaze, silhouette, offset)
  const eyeOpacity = fromFace && toFace ? 1 : toFace ? k : fromFace ? 1 - k : 0
  const eyes = eyeFrame.eyes
    .map((eye) => ({ ...eye, opacity: eye.opacity * eyeOpacity }))
    .filter((eye) => eye.opacity > 0.01)

  return {
    path: silhouettePath(silhouette),
    fill,
    paper: spec.paper ?? DEFAULT_PAPER,
    eyes,
    dots: blendDots(fromGeometry.dots, toGeometry.dots, k),
    shape: shape.id,
    expression: eyeFrame.expression,
    colour: fill,
    gaze: eyeFrame.gaze,
    state: spec.to,
    viewBox: viewBoxAttr(),
    shapeApplied: toGeometry.shapeApplied,
    geometryKind: toGeometry.kind,
  }
}

export function gazeAttr(gaze: HeadGaze): string {
  return `${gaze.yaw},${gaze.pitch},${gaze.roll}`
}

export function colourIdOf(specColour: string | undefined, fill: string): ColorId | string {
  return specColour && !specColour.startsWith('#') ? specColour : fill
}
