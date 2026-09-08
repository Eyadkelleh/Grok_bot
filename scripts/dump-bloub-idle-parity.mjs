#!/usr/bin/env node
/**
 * Dump settled Idle eye centres from the local bloub clone.
 *
 * Loads bloub through Vite SSR (no write into the clone), samples
 * BotEngine.sample(1) for every shape × expression with look wander frozen,
 * and writes radius-normalized coords into
 * src/testing/visual/__parity__/idle-settled.json.
 *
 * Usage:
 *   node scripts/dump-bloub-idle-parity.mjs
 *   BLOUB_ROOT=/path/to/bloub node scripts/dump-bloub-idle-parity.mjs
 *
 * The sibling clone is optional at test time: pnpm test reads the committed
 * dump. Re-run this script only when the bloub rest pose changes.
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url))
const GROK_ROOT = join(SCRIPT_DIR, '..')
const BLOUB_ROOT = process.env.BLOUB_ROOT ?? join(GROK_ROOT, '..', 'bloub')
const OUT_DIR = join(GROK_ROOT, 'src/testing/visual/__parity__')
const OUT_FILE = join(OUT_DIR, 'idle-settled.json')

if (!existsSync(join(BLOUB_ROOT, 'src/bot/engine.ts'))) {
  console.error(`bloub clone not found at ${BLOUB_ROOT}`)
  process.exit(1)
}

const SETTLED_T = 1

const SHAPE = {
  cercle: 'circle',
  galet: 'pebble',
  squircle: 'squircle',
  capsule: 'capsule',
  triangle: 'triangle',
  hexagone: 'hexagon',
  nuage: 'cloud',
  goutte: 'droplet',
}

const EXPR = {
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
}

function finite(n, dp = 6) {
  if (!Number.isFinite(n)) throw new Error(`non-finite: ${n}`)
  const rounded = Number(n.toFixed(dp))
  return Object.is(rounded, -0) ? 0 : rounded
}

function matrixTranslate(matrix) {
  const match = matrix.match(/matrix\(([^)]+)\)/)
  if (!match) throw new Error(`bad matrix: ${matrix}`)
  const parts = match[1].split(',').map(Number)
  if (parts.length !== 6 || parts.some((n) => !Number.isFinite(n))) {
    throw new Error(`bad matrix parts: ${matrix}`)
  }
  return { x: parts[4], y: parts[5] }
}

const server = await createServer({
  root: BLOUB_ROOT,
  configFile: join(BLOUB_ROOT, 'vite.config.ts'),
  server: { middlewareMode: true },
  appType: 'custom',
})

try {
  const { BotEngine } = await server.ssrLoadModule('/src/bot/engine.ts')
  const { EXPRESSIONS } = await server.ssrLoadModule('/src/bot/expressions.ts')
  const { blinkScale } = await server.ssrLoadModule('/src/bot/face.ts')
  const { RAYON } = await server.ssrLoadModule('/src/bot/repere.ts')
  const { SHAPES } = await server.ssrLoadModule('/src/bot/skins.ts')

  const cells = []
  for (const shape of SHAPES) {
    for (const expression of EXPRESSIONS) {
      const engine = new BotEngine(RAYON, 'idle', shape.radii, expression)
      engine.setLook({ yaw: 0, pitch: 0, mix: 0, spin: 0, wander: 0 }, 0)
      const frame = engine.sample(SETTLED_T)
      if (frame.eyes.length !== 2) {
        throw new Error(`idle ${shape.id}/${expression.id} expected 2 eyes, got ${frame.eyes.length}`)
      }
      const grokShape = SHAPE[shape.id]
      const grokExpr = EXPR[expression.id]
      if (!grokShape || !grokExpr) {
        throw new Error(`unmapped ${shape.id}/${expression.id}`)
      }
      cells.push({
        shape: grokShape,
        expression: grokExpr,
        bloubShape: shape.id,
        bloubExpression: expression.id,
        eyes: frame.eyes.map((eye, i) => {
          const { x, y } = matrixTranslate(eye.matrix)
          const cfg = expression.eyes[i]
          return {
            x: finite(x / RAYON),
            y: finite(y / RAYON),
            rx: finite(cfg.w),
            ry: finite(cfg.h * blinkScale(Math.min(1, cfg.open))),
          }
        }),
      })
    }
  }

  mkdirSync(OUT_DIR, { recursive: true })
  writeFileSync(
    OUT_FILE,
    `${JSON.stringify(
      {
        schema: 1,
        kind: 'idle-settled',
        source: 'bloub BotEngine.sample',
        t: SETTLED_T,
        bodyRadius: RAYON,
        wander: 0,
        cells,
      },
      null,
      2,
    )}\n`,
  )
  console.log(`wrote ${cells.length} cells to ${OUT_FILE}`)
} finally {
  await server.close()
}
