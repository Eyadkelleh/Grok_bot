import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const STAGE = join(process.cwd(), 'src/components/Stage.vue')

describe('Stage chrome contract', () => {
  const src = readFileSync(STAGE, 'utf8')

  it('calls desk.openBand from the template and has no setField pass-through', () => {
    expect(src).toMatch(/desk\.openBand\(verb\.id\)/)
    expect(src).not.toMatch(/setField/)
  })

  it('keeps hover, open, and focus-visible on separate verb rules', () => {
    expect(src).toMatch(/\.verbs button\.open\s*\{/)
    expect(src).toMatch(/\.verbs button:hover:not\(\.open\)\s*\{/)
    expect(src).toMatch(/\.verbs button:focus-visible\s*\{/)
    expect(src).not.toMatch(/\.verbs button\.open\s*,/)
    expect(src).not.toMatch(/\.verbs button\.on\s*,/)
  })

  it('does not revive the orbital overlay', () => {
    expect(src).not.toMatch(/orbital/)
    expect(src).toMatch(/layout="compact"/)
    expect(src).toMatch(/layout="strip"/)
    expect(src).toMatch(/isColorId/)
    expect(src).toMatch(/data-colour/)
  })
})
