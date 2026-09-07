import { TAU } from './math'
import {
  PROFILE_SAMPLES,
  regularPolygonProfile,
  superellipse,
} from './morph'

export type ShapeId =
  | 'circle'
  | 'pebble'
  | 'squircle'
  | 'capsule'
  | 'triangle'
  | 'hexagon'
  | 'cloud'
  | 'droplet'

export interface BotShape {
  id: ShapeId
  radii: number[]
}

export type ColorId =
  | 'ink'
  | 'cream'
  | 'brown'
  | 'red'
  | 'orange'
  | 'amber'
  | 'green'
  | 'turquoise'
  | 'blue'
  | 'violet'
  | 'pink'
  | 'grey'

export interface BotColor {
  id: ColorId
  hex: string
}

const ANGLES = Array.from({ length: PROFILE_SAMPLES }, (_, i) => (i / PROFILE_SAMPLES) * TAU)

function normalize(radii: number[], max = 1): number[] {
  const peak = Math.max(...radii)
  if (peak <= 0) return radii
  const k = max / peak
  return radii.map((r) => r * k)
}

/** Far intersection of a ray from the origin with a circle. */
function rayCircle(cos: number, sin: number, cx: number, cy: number, r: number): number {
  const halfB = cx * cos + cy * sin
  const disc = halfB * halfB - (cx * cx + cy * cy - r * r)
  if (disc < 0) return 0
  return Math.max(0, halfB + Math.sqrt(disc))
}

function unionOfCircles(circles: Array<{ x: number; y: number; r: number }>): number[] {
  return ANGLES.map((theta) => {
    const cos = Math.cos(theta)
    const sin = Math.sin(theta)
    let maxR = 0
    for (const c of circles) {
      const hit = rayCircle(cos, sin, c.x, c.y, c.r)
      if (hit > maxR) maxR = hit
    }
    return maxR
  })
}

const pebble = normalize(
  ANGLES.map((a) => 1 + 0.075 * Math.cos(2 * a + 0.5) + 0.035 * Math.cos(3 * a + 2.1)),
  1.02,
)

const cloud = normalize(
  unionOfCircles([
    { x: -0.44, y: 0.2, r: 0.54 },
    { x: 0.46, y: 0.2, r: 0.5 },
    { x: 0.02, y: 0.3, r: 0.6 },
    { x: -0.24, y: -0.3, r: 0.48 },
    { x: 0.3, y: -0.24, r: 0.44 },
  ]),
  1.02,
)

const droplet = normalize(
  unionOfCircles([
    { x: 0, y: 0.28, r: 0.66 },
    { x: 0, y: -0.55, r: 0.28 },
  ]),
  1.04,
)

const capsule = normalize(
  unionOfCircles([
    { x: -0.42, y: 0, r: 0.62 },
    { x: 0.42, y: 0, r: 0.62 },
  ]),
)

export const SHAPES: BotShape[] = [
  { id: 'circle', radii: Array.from({ length: PROFILE_SAMPLES }, () => 1) },
  { id: 'pebble', radii: pebble },
  { id: 'squircle', radii: normalize(superellipse(4.2), 1.15) },
  { id: 'capsule', radii: capsule },
  { id: 'triangle', radii: regularPolygonProfile(3, 1.12) },
  { id: 'hexagon', radii: regularPolygonProfile(6, 1.04, 0) },
  { id: 'cloud', radii: cloud },
  { id: 'droplet', radii: droplet },
]

export const SHAPE_BY_ID = new Map<string, BotShape>(SHAPES.map((s) => [s.id, s]))
export const DEFAULT_SHAPE: ShapeId = 'circle'

export const COLORS: BotColor[] = [
  { id: 'ink', hex: '#0a0a0c' },
  { id: 'brown', hex: '#8b5e3c' },
  { id: 'red', hex: '#e8483f' },
  { id: 'orange', hex: '#f08a24' },
  { id: 'amber', hex: '#f0b429' },
  { id: 'green', hex: '#3ecf8e' },
  { id: 'turquoise', hex: '#2fbfa0' },
  { id: 'blue', hex: '#3b93f0' },
  { id: 'violet', hex: '#8b5cf6' },
  { id: 'pink', hex: '#e152b0' },
  { id: 'grey', hex: '#a3a3a3' },
  { id: 'cream', hex: '#f1efe9' },
]

export const COLOR_BY_ID = new Map<string, BotColor>(COLORS.map((c) => [c.id, c]))
export const DEFAULT_COLOR: ColorId = 'ink'

export function isShapeId(value: string): value is ShapeId {
  return SHAPE_BY_ID.has(value)
}

export function isColorId(value: string): value is ColorId {
  return COLOR_BY_ID.has(value)
}

export function resolveShape(id: string | undefined): BotShape {
  return SHAPE_BY_ID.get(id ?? DEFAULT_SHAPE) ?? SHAPES[0]!
}

export function resolveColour(id: string | undefined): string {
  if (id && id.startsWith('#')) return id
  return COLOR_BY_ID.get(id ?? DEFAULT_COLOR)?.hex ?? '#0a0a0c'
}
