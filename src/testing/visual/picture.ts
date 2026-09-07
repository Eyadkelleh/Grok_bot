import {
  BODY_RADIUS,
  pathForState,
  sampleAvatar,
  sampleMorph,
  type AnimationState,
  type AvatarEye,
  type AvatarFrame,
  type MorphDot,
} from '../../engine'
import type {
  PathCommand,
  PathToken,
  PictureDot,
  PictureEye,
  PictureFrame,
  VisualCase,
} from './types'

const PATH_COMMANDS = new Set<string>(['M', 'L', 'C', 'Q', 'A', 'Z'])
const EYE_KEYS = ['left', 'right'] as const

export function finite(n: number, dp = 6): number {
  if (!Number.isFinite(n)) throw new Error(`non-finite number: ${n}`)
  const rounded = Number(n.toFixed(dp))
  return Object.is(rounded, -0) ? 0 : rounded
}

export function tokenizePath(d: string): PathToken[] {
  const tokens: PathToken[] = []
  let i = 0
  while (i < d.length) {
    const ch = d[i]!
    if (ch === ' ' || ch === ',') {
      i += 1
      continue
    }
    if (PATH_COMMANDS.has(ch)) {
      tokens.push(ch as PathCommand)
      i += 1
      continue
    }
    const match = d.slice(i).match(/^-?\d+(?:\.\d+)?/)
    if (!match) throw new Error(`unknown path token at ${i}: ${d.slice(i, i + 8)}`)
    tokens.push(finite(Number(match[0])))
    i += match[0].length
  }
  if (!tokens.length) throw new Error('empty path')
  return tokens
}

export function frameForCase(visualCase: VisualCase): AvatarFrame {
  const rest = sampleAvatar({
    ...visualCase.props,
    state: visualCase.expect.state,
  })
  const { silhouette } = visualCase.expect
  if (silhouette.kind === 'morph') {
    const morph = sampleMorph(silhouette.from, silhouette.to, silhouette.progress)
    return { ...rest, path: morph.path, dots: morph.dots, eyes: [] }
  }
  if (silhouette.kind === 'state') {
    return { ...rest, path: pathForState(silhouette.state) }
  }
  return rest
}

function parseViewBox(value: string): PictureFrame['viewBox'] {
  const parts = value.split(/\s+/).map(Number)
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) {
    throw new Error(`invalid viewBox: ${value}`)
  }
  return [finite(parts[0]!), finite(parts[1]!), finite(parts[2]!), finite(parts[3]!)]
}

function pictureEye(eye: AvatarEye, key: 'left' | 'right'): PictureEye {
  return {
    key,
    cx: 0,
    cy: 0,
    rx: finite(eye.rx),
    ry: finite(eye.ry),
    opacity: finite(eye.opacity),
    transform: {
      translate: [finite(eye.x), finite(eye.y)],
      matrix: [finite(eye.a), finite(eye.b), finite(eye.c), finite(eye.d), 0, 0],
      rotate: finite(eye.tilt),
    },
    fill: '#000',
  }
}

function pictureDot(dot: MorphDot, key: number, fill: string): PictureDot {
  return {
    key,
    cx: finite(dot.x * BODY_RADIUS),
    cy: finite(dot.y * BODY_RADIUS),
    r: finite(dot.r * BODY_RADIUS),
    opacity: finite(dot.opacity),
    fill,
  }
}

export function pictureFromFrame(
  frame: AvatarFrame,
  state: AnimationState,
  target: AnimationState,
): PictureFrame {
  return {
    schema: 1,
    viewBox: parseViewBox(frame.viewBox),
    state,
    target,
    body: {
      pathTokens: tokenizePath(frame.path),
      paperFill: frame.paper,
      colourFill: frame.fill,
    },
    eyes: frame.eyes.map((eye, i) => pictureEye(eye, EYE_KEYS[i] ?? 'left')),
    dots: frame.dots.map((dot, i) => pictureDot(dot, i, frame.fill)),
  }
}

export function samplePicture(visualCase: VisualCase): PictureFrame {
  const target = visualCase.expect.target ?? visualCase.expect.state
  return pictureFromFrame(frameForCase(visualCase), visualCase.expect.state, target)
}
