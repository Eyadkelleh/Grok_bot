import type { CellMae, DumpMae, IdleSettledCell, NormalizedEye } from './types'

export function finite(n: number, dp = 6): number {
  if (!Number.isFinite(n)) throw new Error(`non-finite number: ${n}`)
  const rounded = Number(n.toFixed(dp))
  return Object.is(rounded, -0) ? 0 : rounded
}

export function meanAbs(values: readonly number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, value) => sum + Math.abs(value), 0) / values.length
}

/** Mean Euclidean distance of paired eye centres, in body-radius units. */
export function eyeCentreMae(a: readonly NormalizedEye[], b: readonly NormalizedEye[]): number {
  const n = Math.min(a.length, b.length)
  if (n === 0) return 0
  let sum = 0
  for (let i = 0; i < n; i++) {
    const left = a[i]!
    const right = b[i]!
    sum += Math.hypot(left.x - right.x, left.y - right.y)
  }
  return sum / n
}

/** Mean absolute error of rx and ry, in body-radius units. */
export function eyeRadiusMae(a: readonly NormalizedEye[], b: readonly NormalizedEye[]): number {
  const n = Math.min(a.length, b.length)
  if (n === 0) return 0
  const errors: number[] = []
  for (let i = 0; i < n; i++) {
    const left = a[i]!
    const right = b[i]!
    errors.push(left.rx - right.rx, left.ry - right.ry)
  }
  return meanAbs(errors)
}

export function cellMae(grok: IdleSettledCell, reference: IdleSettledCell): CellMae {
  return {
    shape: grok.shape,
    expression: grok.expression,
    centreMae: eyeCentreMae(grok.eyes, reference.eyes),
    radiusMae: eyeRadiusMae(grok.eyes, reference.eyes),
    eyes: Math.min(grok.eyes.length, reference.eyes.length),
  }
}

export function dumpMae(grok: readonly IdleSettledCell[], reference: readonly IdleSettledCell[]): DumpMae {
  const byKey = new Map(
    reference.map((cell) => [`${cell.shape}/${cell.expression}`, cell] as const),
  )
  const perCell: CellMae[] = []
  let centreSum = 0
  let radiusSum = 0
  let eyes = 0

  for (const cell of grok) {
    const key = `${cell.shape}/${cell.expression}`
    const ref = byKey.get(key)
    if (!ref) throw new Error(`missing reference cell ${key}`)
    if (cell.eyes.length !== ref.eyes.length) {
      throw new Error(`${key}: eye count ${cell.eyes.length} vs ${ref.eyes.length}`)
    }
    const mae = cellMae(cell, ref)
    perCell.push(mae)
    centreSum += mae.centreMae * mae.eyes
    radiusSum += mae.radiusMae * mae.eyes
    eyes += mae.eyes
  }

  const worstCentre = perCell.reduce<CellMae | undefined>(
    (worst, cell) => (!worst || cell.centreMae > worst.centreMae ? cell : worst),
    undefined,
  )
  const worstRadius = perCell.reduce<CellMae | undefined>(
    (worst, cell) => (!worst || cell.radiusMae > worst.radiusMae ? cell : worst),
    undefined,
  )

  return {
    cells: perCell.length,
    eyes,
    centreMae: eyes === 0 ? 0 : centreSum / eyes,
    radiusMae: eyes === 0 ? 0 : radiusSum / eyes,
    worstCentre,
    worstRadius,
    perCell,
  }
}

export function formatMae(mae: DumpMae): string {
  const worstCentre = mae.worstCentre
    ? `${mae.worstCentre.shape}/${mae.worstCentre.expression} ${mae.worstCentre.centreMae.toFixed(4)}`
    : 'none'
  const worstRadius = mae.worstRadius
    ? `${mae.worstRadius.shape}/${mae.worstRadius.expression} ${mae.worstRadius.radiusMae.toFixed(4)}`
    : 'none'
  return [
    `Idle settled MAE over ${mae.cells} cells / ${mae.eyes} eyes`,
    `  centre MAE ${mae.centreMae.toFixed(4)} (worst ${worstCentre})`,
    `  radius MAE ${mae.radiusMae.toFixed(4)} (worst ${worstRadius})`,
  ].join('\n')
}
