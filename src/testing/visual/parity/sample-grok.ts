import { BODY_RADIUS, EXPRESSIONS, SHAPES, sampleAvatar } from '../../../engine'
import { GROK_EXPRESSION_TO_BLOUB, GROK_SHAPE_TO_BLOUB } from './ids'
import { finite } from './mae'
import type { IdleSettledCell, NormalizedEye } from './types'

export function normalizeGrokEye(
  eye: { x: number; y: number; rx: number; ry: number },
  bodyRadius = BODY_RADIUS,
): NormalizedEye {
  return {
    x: finite(eye.x / bodyRadius),
    y: finite(eye.y / bodyRadius),
    rx: finite(eye.rx / bodyRadius),
    ry: finite(eye.ry / bodyRadius),
  }
}

export function sampleGrokIdleCell(
  shape: (typeof SHAPES)[number]['id'],
  expression: (typeof EXPRESSIONS)[number]['id'],
): IdleSettledCell {
  const frame = sampleAvatar({ state: 'Idle', shape, expression })
  if (frame.eyes.length !== 2) {
    throw new Error(`Idle ${shape}/${expression} expected 2 eyes, got ${frame.eyes.length}`)
  }
  return {
    shape,
    expression,
    bloubShape: GROK_SHAPE_TO_BLOUB[shape],
    bloubExpression: GROK_EXPRESSION_TO_BLOUB[expression],
    eyes: frame.eyes.map((eye) => normalizeGrokEye(eye)),
  }
}

export function sampleGrokIdleGrid(): IdleSettledCell[] {
  const cells: IdleSettledCell[] = []
  for (const shape of SHAPES) {
    for (const expression of EXPRESSIONS) {
      cells.push(sampleGrokIdleCell(shape.id, expression.id))
    }
  }
  return cells
}
