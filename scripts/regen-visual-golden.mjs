#!/usr/bin/env node

import { spawnSync } from 'node:child_process'

const result = spawnSync(
  'pnpm',
  [
    'vitest',
    'run',
    'src/engine/__tests__/visual-loop.spec.ts',
    'src/__tests__/Avatar.visual.spec.ts',
    '-u',
  ],
  { stdio: 'inherit' },
)

process.exit(result.status ?? 1)
