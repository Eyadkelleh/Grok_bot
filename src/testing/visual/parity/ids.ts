/**
 * French bloub catalogue IDs → Grok English IDs.
 *
 * Measured look/motion parity talks in Grok IDs. The sibling clone still
 * names shapes, expressions, and colours in French (`cercle`, `neutre`,
 * `encre`). This table is the only translation the settled-frame harness
 * needs; later units should import it instead of forking another map.
 */

export const BLOUB_SHAPE_TO_GROK = {
  cercle: 'circle',
  galet: 'pebble',
  squircle: 'squircle',
  capsule: 'capsule',
  triangle: 'triangle',
  hexagone: 'hexagon',
  nuage: 'cloud',
  goutte: 'droplet',
} as const

export const BLOUB_EXPRESSION_TO_GROK = {
  neutre: 'neutral',
  attentif: 'attentive',
  surpris: 'surprised',
  excite: 'excited',
  heureux: 'happy',
  hilare: 'laughing',
  colere: 'angry',
  triste: 'sad',
  effraye: 'scared',
  mefiant: 'wary',
  confus: 'confused',
  curieux: 'curious',
  fier: 'proud',
  timide: 'shy',
  blase: 'bored',
  somnolent: 'sleepy',
} as const

export const BLOUB_COLOUR_TO_GROK = {
  encre: 'ink',
  creme: 'cream',
  brun: 'brown',
  rouge: 'red',
  orange: 'orange',
  ambre: 'amber',
  vert: 'green',
  turquoise: 'turquoise',
  bleu: 'blue',
  violet: 'violet',
  rose: 'pink',
  gris: 'grey',
} as const

export type BloubShapeId = keyof typeof BLOUB_SHAPE_TO_GROK
export type BloubExpressionId = keyof typeof BLOUB_EXPRESSION_TO_GROK
export type BloubColourId = keyof typeof BLOUB_COLOUR_TO_GROK

export type GrokShapeId = (typeof BLOUB_SHAPE_TO_GROK)[BloubShapeId]
export type GrokExpressionId = (typeof BLOUB_EXPRESSION_TO_GROK)[BloubExpressionId]
export type GrokColourId = (typeof BLOUB_COLOUR_TO_GROK)[BloubColourId]

function invert<K extends string, V extends string>(
  table: Record<K, V>,
): Record<V, K> {
  return Object.fromEntries(
    Object.entries(table).map(([from, to]) => [to, from]),
  ) as Record<V, K>
}

export const GROK_SHAPE_TO_BLOUB = invert(BLOUB_SHAPE_TO_GROK)
export const GROK_EXPRESSION_TO_BLOUB = invert(BLOUB_EXPRESSION_TO_GROK)
export const GROK_COLOUR_TO_BLOUB = invert(BLOUB_COLOUR_TO_GROK)

export function grokShapeOf(id: string): GrokShapeId {
  const mapped = BLOUB_SHAPE_TO_GROK[id as BloubShapeId]
  if (mapped) return mapped
  throw new Error(`unknown bloub shape id: ${id}`)
}

export function grokExpressionOf(id: string): GrokExpressionId {
  const mapped = BLOUB_EXPRESSION_TO_GROK[id as BloubExpressionId]
  if (mapped) return mapped
  throw new Error(`unknown bloub expression id: ${id}`)
}

export function grokColourOf(id: string): GrokColourId {
  const mapped = BLOUB_COLOUR_TO_GROK[id as BloubColourId]
  if (mapped) return mapped
  throw new Error(`unknown bloub colour id: ${id}`)
}

export function bloubShapeOf(id: string): BloubShapeId {
  const mapped = GROK_SHAPE_TO_BLOUB[id as GrokShapeId]
  if (mapped) return mapped
  throw new Error(`unknown grok shape id: ${id}`)
}

export function bloubExpressionOf(id: string): BloubExpressionId {
  const mapped = GROK_EXPRESSION_TO_BLOUB[id as GrokExpressionId]
  if (mapped) return mapped
  throw new Error(`unknown grok expression id: ${id}`)
}
