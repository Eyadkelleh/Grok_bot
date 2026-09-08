import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { IdleSettledDump } from './types'

const DUMP_PATH = join(process.cwd(), 'src/testing/visual/__parity__/idle-settled.json')

export function idleSettledDumpPath(): string {
  return DUMP_PATH
}

export function loadIdleSettledDump(): IdleSettledDump {
  const dump = JSON.parse(readFileSync(DUMP_PATH, 'utf8')) as IdleSettledDump
  if (dump.schema !== 1 || dump.kind !== 'idle-settled') {
    throw new Error(`unexpected idle dump at ${DUMP_PATH}`)
  }
  if (!Array.isArray(dump.cells) || dump.cells.length === 0) {
    throw new Error(`empty idle dump at ${DUMP_PATH}`)
  }
  return dump
}
