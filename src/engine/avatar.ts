import {
  poseRadii,
  resolveStateGeometry,
  STATE_GEOMETRY,
  type FacePolicy,
  type PoseTransform,
  type ResolvedGeometry,
} from './authority'
import { blendEyeOffset, eyeOffset, type EyeOffset } from './eyefit'
import { resolveExpression, type ExpressionId } from './expressions'
import {
  blinkScale,
  eyePoses,
  liveliness,
  resolveGaze,
  type GazeInput,
  type HeadGaze,
  type Liveliness,
} from './face'
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
import { poseAt } from './pose'
import { blendDots, isAnimationState, resolveVisage, type AnimationState, type MorphDot } from './states'

export interface AvatarSpec {
  size?: number
  shape?: string
  expression?: string
  gaze?: GazeInput
  colour?: string
  state?: string
  paper?: string
  /** Local time within the current state, in seconds. Omit for the still registry pose. */
  t?: number
  /**
   * Rest-face gaze wander. 0 (default) keeps Idle still so L0 dumps match.
   * 1 is full rest amplitude. When set above 0, blink and float default on
   * unless they are passed explicitly.
   */
  wander?: number
  /** Blink calendar. Default false when wander is 0, true when wander > 0. */
  blink?: boolean
  /** Body drift and breath. Default false when wander is 0, true when wander > 0. */
  float?: boolean
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
  /** Local time of the outgoing state while morphing. */
  fromT?: number
  /** Local time of the incoming state while morphing. */
  toT?: number
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

/** Still when unset. Wander > 0 turns blink and float on unless overridden. */
export function lifeFromSpec(spec: Pick<AvatarSpec, 't' | 'wander' | 'blink' | 'float'>): Liveliness | null {
  const wander = spec.wander ?? 0
  const blink = spec.blink ?? wander > 0
  const float = spec.float ?? wander > 0
  if (wander === 0 && !blink && !float) return null
  return liveliness(spec.t ?? 0, { wander, blink, float })
}

function withLife(silhouette: Silhouette, life: Liveliness): Silhouette {
  return {
    ...silhouette,
    cx: silhouette.cx + life.driftX,
    cy: silhouette.cy + life.driftY,
    sy: silhouette.sy * life.breath,
  }
}

function eyesFor(
  face: FacePolicy,
  expressionId: string | undefined,
  gaze: GazeInput | undefined,
  silhouette: Silhouette,
  offset: EyeOffset,
  life: Liveliness | null = null,
): { eyes: AvatarEye[]; gaze: HeadGaze; expression: ExpressionId } {
  const expression = resolveExpression(expressionId)
  const vis = resolveVisage(face, expression)
  const resolved = resolveGaze(vis.gaze, gaze)
  if (life) {
    resolved.yaw += life.dYaw
    resolved.pitch += life.dPitch
    resolved.roll += life.dRoll
  }
  if (!showsFace(face)) {
    return { eyes: [], gaze: resolved, expression: expression.id }
  }

  const cfgs = vis.eyes
  const poses = eyePoses(resolved, BODY_RADIUS, vis.split)
  const shiftX = (offset.x + (life?.driftX ?? 0)) * BODY_RADIUS
  const shiftY = (offset.y + (life?.driftY ?? 0)) * BODY_RADIUS
  const lidOpen = life?.lid ?? 1
  const eyes: AvatarEye[] = poses.map((pose, i) => {
    const cfg = cfgs[i]!
    const lid = blinkScale(Math.min(lidOpen, cfg.open))
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

function poseOf(silhouette: { rot: number; cx: number; cy: number; sx: number; sy: number }): PoseTransform {
  return {
    rot: silhouette.rot,
    cx: silhouette.cx,
    cy: silhouette.cy,
    sx: silhouette.sx,
    sy: silhouette.sy,
  }
}

function geometryAt(state: AnimationState, shapeId?: string, localT?: number): ResolvedGeometry {
  if (localT === undefined) return resolveStateGeometry(state, shapeId)
  const posed = poseAt(state, localT)
  const recipe = STATE_GEOMETRY[state]
  if (recipe.kind === 'symbol') {
    return {
      silhouette: posed.silhouette,
      shapeApplied: false,
      kind: 'symbol',
      face: recipe.face,
      dots: posed.dots,
    }
  }
  return {
    silhouette: poseRadii(resolveShape(shapeId).radii, posed.silhouette.radii[0] ?? 1, poseOf(posed.silhouette)),
    shapeApplied: true,
    kind: 'wearable',
    face: recipe.face,
    dots: posed.dots,
  }
}

export function activeSilhouette(state: AnimationState, shapeId?: string): Silhouette {
  return resolveStateGeometry(state, shapeId).silhouette
}

export function sampleAvatar(spec: AvatarSpec = {}): AvatarFrame {
  const state = resolveState(spec.state)
  const shape = resolveShape(spec.shape)
  const fill = resolveColour(spec.colour)
  const paper = spec.paper ?? DEFAULT_PAPER
  const life = lifeFromSpec(spec)
  const geometry = geometryAt(state, shape.id, spec.t)
  const silhouette = life ? withLife(geometry.silhouette, life) : geometry.silhouette
  const { eyes, gaze, expression } = eyesFor(
    geometry.face,
    spec.expression,
    spec.gaze,
    silhouette,
    eyeOffset(shape.id, state, spec.expression),
    life,
  )
  const dots = life
    ? geometry.dots.map((dot) => ({ ...dot, x: dot.x + life.driftX, y: dot.y + life.driftY }))
    : geometry.dots

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
    shapeApplied: geometry.shapeApplied,
    geometryKind: geometry.kind,
  }
}

export function sampleLiveMorph(spec: LiveMorphSpec): AvatarFrame {
  const shape = resolveShape(spec.toShape ?? spec.shape)
  const fill = resolveColour(spec.colour)
  const k = easeOutQuint(clamp(spec.t))
  const fromGeometry = geometryAt(spec.from, spec.fromShape ?? spec.shape, spec.fromT)
  const toGeometry = geometryAt(spec.to, spec.toShape ?? spec.shape, spec.toT)
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
