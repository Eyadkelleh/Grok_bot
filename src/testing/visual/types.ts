import type { AnimationState, Block, GazeInput, ShapeId } from '../../engine'

export type AvatarProps = {
  size?: number
  shape?: string
  expression?: string
  gaze?: GazeInput
  colour?: string
  state?: AnimationState | string
  paper?: string
  label?: string
  durationMs?: number
}

export type Seek = {
  readonly blocks: readonly Block[]
  readonly at: number
}

export type Silhouette =
  | { readonly kind: 'shape'; readonly shape?: ShapeId }
  | { readonly kind: 'state'; readonly state: AnimationState }
  | {
      readonly kind: 'morph'
      readonly from: AnimationState
      readonly to: AnimationState
      readonly progress: number
    }

export type FaceKind = 'pictures' | 'glyph' | 'morphing' | 'blank'

export type VisualExpectation = {
  readonly face: FaceKind
  readonly state: AnimationState
  readonly target?: AnimationState
  readonly eyes: number
  readonly dots: number
  readonly silhouette: Silhouette
}

export type GoldenKind = 'facts' | 'picture' | 'both' | 'none'

export type VisualCase = {
  readonly id: string
  readonly what: string
  readonly props: AvatarProps
  readonly seek?: Seek
  readonly expect: VisualExpectation
  readonly golden?: GoldenKind
}

export type PathCommand = 'M' | 'L' | 'C' | 'Q' | 'A' | 'Z'
export type PathToken = PathCommand | number

export type PictureEye = {
  readonly key: 'left' | 'right'
  readonly cx: 0
  readonly cy: 0
  readonly rx: number
  readonly ry: number
  readonly opacity: number
  readonly transform: {
    readonly translate: readonly [number, number]
    readonly matrix: readonly [number, number, number, number, 0, 0]
    readonly rotate: number
  }
  readonly fill: '#000'
}

export type PictureDot = {
  readonly key: number
  readonly cx: number
  readonly cy: number
  readonly r: number
  readonly opacity: number
  readonly fill: string
}

export type PictureFrame = {
  readonly schema: 1
  readonly viewBox: readonly [number, number, number, number]
  readonly state: AnimationState
  readonly target: AnimationState
  readonly body: {
    readonly pathTokens: readonly PathToken[]
    readonly paperFill: string
    readonly colourFill: string
  }
  readonly eyes: readonly PictureEye[]
  readonly dots: readonly PictureDot[]
}
