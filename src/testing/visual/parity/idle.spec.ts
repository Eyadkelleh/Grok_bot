import { describe, expect, it } from 'vitest'
import { COLORS, EXPRESSIONS, SHAPES } from '../../../engine'
import {
  BLOUB_COLOUR_TO_GROK,
  BLOUB_EXPRESSION_TO_GROK,
  BLOUB_SHAPE_TO_GROK,
  GROK_COLOUR_TO_BLOUB,
  GROK_EXPRESSION_TO_BLOUB,
  GROK_SHAPE_TO_BLOUB,
  bloubExpressionOf,
  grokColourOf,
  grokExpressionOf,
  grokShapeOf,
} from './ids'
import { loadIdleSettledDump } from './load-dump'
import { dumpMae, formatMae } from './mae'
import { sampleGrokIdleGrid } from './sample-grok'

/**
 * Locked Idle settled-frame budgets, in body-radius units.
 *
 * Grok coords are pixels / BODY_RADIUS (~46). Bloub coords are pixels / RAYON
 * (100). A centre MAE of 0.02 is two hundredths of the rest ball.
 *
 * Measured against the committed dump on 8 Sep 2026 after K1 eyefit:
 * aggregate centre 0.0028, radius 0, worst cell 0.0029.
 *
 * These ceilings are the L0 harness lock. Do not raise them to silence a
 * regression. The cell centre budget tightened once tabulated eyefit cut
 * wearable outliers such as cloud/shy.
 */
export const IDLE_EYE_CENTRE_MAE_MAX = 0.05
export const IDLE_EYE_RADIUS_MAE_MAX = 0.01
export const IDLE_EYE_CENTRE_CELL_MAE_MAX = 0.01
export const IDLE_EYE_RADIUS_CELL_MAE_MAX = 0.01

describe('bloub ID map', () => {
  it('maps every Grok shape, expression, and colour onto a French bloub id', () => {
    expect(SHAPES.map((shape) => shape.id).sort()).toEqual(
      Object.values(BLOUB_SHAPE_TO_GROK).slice().sort(),
    )
    expect(EXPRESSIONS.map((expression) => expression.id).sort()).toEqual(
      Object.values(BLOUB_EXPRESSION_TO_GROK).slice().sort(),
    )
    expect(COLORS.map((colour) => colour.id).sort()).toEqual(
      Object.values(BLOUB_COLOUR_TO_GROK).slice().sort(),
    )
    expect(Object.keys(BLOUB_COLOUR_TO_GROK).sort()).toEqual(
      Object.values(GROK_COLOUR_TO_BLOUB).slice().sort(),
    )
    expect(grokShapeOf('cercle')).toBe('circle')
    expect(grokExpressionOf('neutre')).toBe('neutral')
    expect(grokColourOf('encre')).toBe('ink')
    expect(bloubExpressionOf('laughing')).toBe('hilare')
    expect(GROK_SHAPE_TO_BLOUB.hexagon).toBe('hexagone')
    expect(GROK_EXPRESSION_TO_BLOUB.happy).toBe('heureux')
  })
})

describe('Idle settled-frame parity', () => {
  it('keeps Grok Idle eyes within locked MAE of the committed bloub dump', () => {
    const dump = loadIdleSettledDump()
    expect(dump.t).toBe(1)
    expect(dump.wander).toBe(0)
    expect(dump.cells).toHaveLength(SHAPES.length * EXPRESSIONS.length)

    const grok = sampleGrokIdleGrid()
    expect(grok).toHaveLength(dump.cells.length)

    const mae = dumpMae(grok, dump.cells)
    const report = formatMae(mae)
    const worstCentre = mae.worstCentre?.centreMae ?? 0
    const worstRadius = mae.worstRadius?.radiusMae ?? 0

    expect(mae.centreMae, `${report}\ncentre MAE`).toBeLessThanOrEqual(IDLE_EYE_CENTRE_MAE_MAX)
    expect(mae.radiusMae, `${report}\nradius MAE`).toBeLessThanOrEqual(IDLE_EYE_RADIUS_MAE_MAX)
    expect(worstCentre, `${report}\nworst-cell centre MAE`).toBeLessThanOrEqual(
      IDLE_EYE_CENTRE_CELL_MAE_MAX,
    )
    expect(worstRadius, `${report}\nworst-cell radius MAE`).toBeLessThanOrEqual(
      IDLE_EYE_RADIUS_CELL_MAE_MAX,
    )
  })

  it('fails loudly when a cell is shifted beyond the locked centre budget', () => {
    const dump = loadIdleSettledDump()
    const [ref] = dump.cells
    if (!ref) throw new Error('empty dump')
    const shifted = {
      ...ref,
      eyes: ref.eyes.map((eye) => ({ ...eye, x: eye.x + IDLE_EYE_CENTRE_MAE_MAX + 0.05 })),
    }
    const mae = dumpMae([shifted], [ref])
    expect(mae.centreMae).toBeGreaterThan(IDLE_EYE_CENTRE_MAE_MAX)
  })
})
