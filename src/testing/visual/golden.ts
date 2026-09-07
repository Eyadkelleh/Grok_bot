import { existsSync } from 'node:fs'
import { mkdir, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { expect } from 'vitest'
import type { PictureFrame, VisualCase } from './types'

const GOLDEN_DIR = join(process.cwd(), 'src/testing/visual/__golden__')

export function pictureGoldenPath(id: string): string {
  return join(GOLDEN_DIR, `${id}.json`)
}

export function svgGoldenPath(id: string): string {
  return join(GOLDEN_DIR, `${id}.svg`)
}

export function wantsPicture(visualCase: VisualCase): boolean {
  const golden = visualCase.golden ?? 'picture'
  return golden === 'facts' || golden === 'picture' || golden === 'both'
}

export function wantsSvg(visualCase: VisualCase): boolean {
  return visualCase.golden === 'both'
}

export function serialisePicture(picture: PictureFrame): string {
  return `${JSON.stringify(picture, null, 2)}\n`
}

export async function expectPictureGolden(picture: PictureFrame, visualCase: VisualCase) {
  await mkdir(GOLDEN_DIR, { recursive: true })
  await expect(serialisePicture(picture)).toMatchFileSnapshot(pictureGoldenPath(visualCase.id))
}

export async function expectSvgGolden(markup: string, visualCase: VisualCase) {
  await mkdir(GOLDEN_DIR, { recursive: true })
  await expect(markup).toMatchFileSnapshot(svgGoldenPath(visualCase.id))
}

export function quantiseSvgNumbers(markup: string, dp = 3): string {
  return markup.replace(/-?\d+\.\d+/g, (raw) => {
    const rounded = Number(Number(raw).toFixed(dp))
    return Object.is(rounded, -0) ? '0' : String(rounded)
  })
}

export function formatSvg(markup: string): string {
  return `${markup.replace(/></g, '>\n<')}\n`
}

export async function assertGoldenInventory(cases: readonly VisualCase[]) {
  const ids = new Set(cases.map((visualCase) => visualCase.id))
  if (!existsSync(GOLDEN_DIR)) return
  const files = await readdir(GOLDEN_DIR)
  for (const file of files) {
    if (file.startsWith('.')) continue
    const id = file.replace(/\.(json|svg)$/, '')
    expect(ids.has(id), `orphan golden ${file}`).toBe(true)
  }
}
