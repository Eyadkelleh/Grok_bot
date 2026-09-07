#!/usr/bin/env node

/**
 * Deterministic Avatar quality loop.
 *
 * Run `pnpm test:ui-avatar` for the pure-engine checks used in CI.
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

if (process.argv.includes('--urls')) {
  for (const slug of slugs) {
    console.log(`http://127.0.0.1:5174/#etat=${slug}&stop`)
  }
  process.exit(0)
}

const result = spawnSync(
  'pnpm',
  ['vitest', 'run', 'src/engine/__tests__/visual-loop.spec.ts'],
  { stdio: 'inherit' },
)

process.exit(result.status ?? 1)
