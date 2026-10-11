import { type ArcSpec } from './decor'
import { silhouetteFromRadii, type Silhouette } from './morph'
import { resolveShape } from './skins'
import { STATE_REGISTRY, type AnimationState, type MorphDot } from './states'

export type FacePolicy = 'expression' | 'wink' | 'wide' | 'notify' | 'none'

export type PoseTransform = Pick<Silhouette, 'rot' | 'cx' | 'cy' | 'sx' | 'sy'>

export type StateGeometry =
  | {
      kind: 'wearable'
      scale: number
      pose: PoseTransform
      face: FacePolicy
      dots: MorphDot[]
      arcs: ArcSpec[]
      dotsBehind: boolean
    }
  | {
      kind: 'symbol'
      silhouette: Silhouette
      face: FacePolicy
      dots: MorphDot[]
      arcs: ArcSpec[]
      dotsBehind: boolean
    }

export interface ResolvedGeometry {
  silhouette: Silhouette
  shapeApplied: boolean
  kind: StateGeometry['kind']
  face: FacePolicy
  dots: MorphDot[]
  arcs: ArcSpec[]
  dotsBehind: boolean
}

function poseOf(silhouette: Silhouette): PoseTransform {
  return {
    rot: silhouette.rot,
    cx: silhouette.cx,
    cy: silhouette.cy,
    sx: silhouette.sx,
    sy: silhouette.sy,
  }
}

function wearable(state: AnimationState, face: FacePolicy): Extract<StateGeometry, { kind: 'wearable' }> {
  const { silhouette, dots, arcs, dotsBehind } = STATE_REGISTRY[state]
  return {
    kind: 'wearable',
    scale: silhouette.radii[0] ?? 1,
    pose: poseOf(silhouette),
    face,
    dots,
    arcs,
    dotsBehind,
  }
}

function symbol(state: AnimationState, face: FacePolicy = 'none'): Extract<StateGeometry, { kind: 'symbol' }> {
  const { silhouette, dots, arcs, dotsBehind } = STATE_REGISTRY[state]
  return { kind: 'symbol', silhouette, face, dots, arcs, dotsBehind }
}

export const STATE_GEOMETRY = {
  Idle: wearable('Idle', 'expression'),
  Thinking: wearable('Thinking', 'none'),
  Wink: wearable('Wink', 'wink'),
  WideEyes: wearable('WideEyes', 'wide'),
  // G5 accept-symbol-glyphs: measured bar glyphs cannot wear customiser squash.
  Alert: symbol('Alert'),
  // G3 measured-state-faces: wink / wide / notify keep their video poses.
  Notification: wearable('Notification', 'notify'),
  Exclamation: symbol('Exclamation'),
  Sleep: wearable('Sleep', 'none'),
  Egg: symbol('Egg'),
  Hexagon: symbol('Hexagon'),
  Play: symbol('Play'),
  Orbit: symbol('Orbit'),
  Burst: wearable('Burst', 'none'),
  Comet: wearable('Comet', 'none'),
} satisfies Record<AnimationState, StateGeometry>

export function poseRadii(
  radii: readonly number[],
  scale: number,
  pose: PoseTransform,
): Silhouette {
  return silhouetteFromRadii(
    radii.map((radius) => radius * scale),
    pose,
  )
}

export function resolveStateGeometry(state: AnimationState, shapeId?: string): ResolvedGeometry {
  const recipe = STATE_GEOMETRY[state]
  if (recipe.kind === 'symbol') {
    return {
      silhouette: recipe.silhouette,
      shapeApplied: false,
      kind: 'symbol',
      face: recipe.face,
      dots: recipe.dots,
      arcs: recipe.arcs,
      dotsBehind: recipe.dotsBehind,
    }
  }
  return {
    silhouette: poseRadii(resolveShape(shapeId).radii, recipe.scale, recipe.pose),
    shapeApplied: true,
    kind: 'wearable',
    face: recipe.face,
    dots: recipe.dots,
    arcs: recipe.arcs,
    dotsBehind: recipe.dotsBehind,
  }
}

export function usesCustomiserShape(state: AnimationState): boolean {
  return STATE_GEOMETRY[state].kind === 'wearable'
}
