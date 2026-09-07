#!/usr/bin/env node

/**
 * Deterministic Avatar quality loop.
 *
 * Run `pnpm test:ui-avatar` for the engine PictureFrame goldens and Vue mount matrix.
 * Dump standalone SVG through the same Vitest/jsdom helpers:
 * `node scripts/ui-avatar-loop.mjs --dump /tmp/grok-bot-visual`
 * For a manual screenshot pass, run `pnpm dev --port 5174`, then:
 * `node scripts/ui-avatar-loop.mjs --urls`
 * and open each printed `#etat=<slug>&stop` URL in a browser.
 */

import { spawnSync } from 'node:child_process'

const slugs = [
  'idle',
  'thinking',
  'wink',
  'wide',
  'alert',
  'notify',
  'exclaim',
  'sleep',
  'egg',
  'hexagon',
  'play',
  'orbit',
  'burst',
  'comet',
]

const visualSpecs = [
  'src/engine/__tests__/visual-loop.spec.ts',
  'src/__tests__/Avatar.visual.spec.ts',
]

if (process.argv.includes('--urls')) {
  for (const slug of slugs) {
    console.log(`http://127.0.0.1:5174/#etat=${slug}&stop`)
  }
  process.exit(0)
}

const dumpIdx = process.argv.indexOf('--dump')
if (dumpIdx !== -1) {
  const dir = process.argv[dumpIdx + 1]
  if (!dir || dir.startsWith('-')) {
    console.error('usage: node scripts/ui-avatar-loop.mjs --dump <dir>')
    process.exit(1)
  }
  const result = spawnSync('pnpm', ['vitest', 'run', 'src/__tests__/Avatar.visual.spec.ts', '-t', 'visual dump'], {
    stdio: 'inherit',
    env: { ...process.env, VISUAL_DUMP: dir },
  })
  process.exit(result.status ?? 1)
}

const result = spawnSync('pnpm', ['vitest', 'run', ...visualSpecs], { stdio: 'inherit' })

process.exit(result.status ?? 1)
