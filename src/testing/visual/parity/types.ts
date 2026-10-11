import type { GrokExpressionId, GrokShapeId } from './ids'

/** One eye in body-radius units (divide pixels by BODY_RADIUS or RAYON). */
export type NormalizedEye = {
  readonly x: number
  readonly y: number
  readonly rx: number
  readonly ry: number
}

export type IdleSettledCell = {
  readonly shape: GrokShapeId
  readonly expression: GrokExpressionId
  readonly bloubShape: string
  readonly bloubExpression: string
  readonly eyes: readonly NormalizedEye[]
}

export type IdleSettledDump = {
  readonly schema: 1
  readonly kind: 'idle-settled'
  readonly source: string
  /** Locked sample time for BotEngine.sample(t). Past Idle morph, before the first blink. */
  readonly t: number
  readonly bodyRadius: number
  readonly wander: 0
  readonly cells: readonly IdleSettledCell[]
}

export type CellMae = {
  readonly shape: GrokShapeId
  readonly expression: GrokExpressionId
  readonly centreMae: number
  readonly radiusMae: number
  readonly eyes: number
}

export type DumpMae = {
  readonly cells: number
  readonly eyes: number
  readonly centreMae: number
  readonly radiusMae: number
  readonly worstCentre: CellMae | undefined
  readonly worstRadius: CellMae | undefined
  readonly perCell: readonly CellMae[]
}
