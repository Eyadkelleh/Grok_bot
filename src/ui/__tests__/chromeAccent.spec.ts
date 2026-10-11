import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  COLOR_BY_ID,
  COLORS,
  DEFAULT_COLOR,
  resolveColour,
  type ColorId,
} from '../../engine'
import * as accentModule from '../chromeAccent'
import { resolveChromeAccent } from '../chromeAccent'

function luminance(hex: string): number {
  const n = Number.parseInt(hex.slice(1), 16)
  const channel = (v: number) => {
    const s = v / 255
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  const r = channel((n >> 16) & 255)
  const g = channel((n >> 8) & 255)
  const b = channel(n & 255)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

describe('resolveChromeAccent', () => {
  it('exports only the resolver', () => {
    expect(Object.keys(accentModule)).toEqual(['resolveChromeAccent'])
  })

  it('derives source hex from COLOR_BY_ID and resolveColour', () => {
    for (const { id, hex } of COLORS) {
      const accent = resolveChromeAccent(id)
      expect(accent.sourceHex).toBe(hex)
      expect(accent.sourceHex).toBe(resolveColour(id))
      expect(accent.sourceHex).toBe(COLOR_BY_ID.get(id)?.hex)
      expect(accent.cssVars['--bot-accent']).toBe(hex)
      expect(accent.cssVars['--bot-accent-rgb']).toBe(
        `${accent.rgb[0]} ${accent.rgb[1]} ${accent.rgb[2]}`,
      )
      expect(accent.cssVars['--accent-display']).toBe(accent.displayHex)
      expect(accent.cssVars['--accent-contrast']).toBe(accent.contrastHex)
    }
  })

  it('lifts ink and darkens cream for chrome without rewriting the catalogue', () => {
    const inkHex = COLOR_BY_ID.get('ink')!.hex
    const creamHex = COLOR_BY_ID.get('cream')!.hex
    const ink = resolveChromeAccent('ink')
    const cream = resolveChromeAccent('cream')

    expect(ink.sourceHex).toBe(inkHex)
    expect(cream.sourceHex).toBe(creamHex)
    expect(ink.displayHex).not.toBe(ink.sourceHex)
    expect(cream.displayHex).not.toBe(cream.sourceHex)
    expect(luminance(ink.displayHex)).toBeGreaterThan(luminance(ink.sourceHex))
    expect(luminance(cream.displayHex)).toBeLessThan(luminance(cream.sourceHex))
    expect(ink.contrastHex).toBe('#ffffff')
    expect(cream.contrastHex).toBe('#000000')
    expect(COLOR_BY_ID.get('ink')?.hex).toBe(inkHex)
    expect(COLOR_BY_ID.get('cream')?.hex).toBe(creamHex)
    expect(resolveColour('ink')).toBe(inkHex)
    expect(resolveColour('cream')).toBe(creamHex)
  })

  it('keeps mid-catalogue colours as their own display tint', () => {
    const mid = COLORS.filter((c) => c.id !== 'ink' && c.id !== 'cream')
    expect(mid.length).toBeGreaterThan(0)
    for (const { id, hex } of mid) {
      const accent = resolveChromeAccent(id)
      expect(accent.displayHex).toBe(hex)
      expect(accent.sourceHex).toBe(hex)
    }
  })

  it('accepts custom hex and still floors extremes', () => {
    const custom = resolveChromeAccent('#3b93f0')
    expect(custom.sourceHex).toBe('#3b93f0')
    expect(custom.displayHex).toBe('#3b93f0')

    const black = resolveChromeAccent('#000000')
    expect(black.sourceHex).toBe('#000000')
    expect(black.displayHex).not.toBe('#000000')
    expect(luminance(black.displayHex)).toBeGreaterThan(luminance(black.sourceHex))

    const white = resolveChromeAccent('#ffffff')
    expect(white.sourceHex).toBe('#ffffff')
    expect(white.displayHex).not.toBe('#ffffff')
    expect(luminance(white.displayHex)).toBeLessThan(luminance(white.sourceHex))
    expect(white.contrastHex).toBe('#000000')
  })

  it('defaults the rgb tuple to the engine default colour', () => {
    const accent = resolveChromeAccent(DEFAULT_COLOR)
    const hex = COLOR_BY_ID.get(DEFAULT_COLOR)!.hex
    const n = Number.parseInt(hex.slice(1), 16)
    expect(accent.sourceHex).toBe(hex)
    expect(accent.rgb).toEqual([(n >> 16) & 255, (n >> 8) & 255, n & 255])
  })

  it('does not feed accent tokens into the export path', () => {
    const files = [
      'src/ui/export.ts',
      'src/ui/capture.ts',
      'src/ui/gif.ts',
      'src/ui/video.ts',
      'src/ui/matte.ts',
      'src/ui/bannerExport.ts',
    ]
    for (const file of files) {
      const src = readFileSync(join(process.cwd(), file), 'utf8')
      expect(src, file).not.toMatch(/chromeAccent|--bot-accent|--accent-display/)
    }
  })

  it('types the resolver against catalogue ids', () => {
    const id: ColorId = 'violet'
    expect(resolveChromeAccent(id).sourceHex).toBe('#8b5cf6')
  })
})
