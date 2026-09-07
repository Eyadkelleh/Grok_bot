import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('lazy MP4 encoder', () => {
  it('loads mediabunny only inside versMp4', () => {
    const src = readFileSync(resolve('src/ui/video.ts'), 'utf8')
    expect(src).toMatch(/await import\(\s*['"]mediabunny['"]\s*\)/)
    expect(src).not.toMatch(/^import .+ from ['"]mediabunny['"]/m)
  })

  it('is not imported statically from the capture module', () => {
    const src = readFileSync(resolve('src/ui/capture.ts'), 'utf8')
    expect(src).toMatch(/await import\(['"]\.\/video['"]\)/)
    expect(src).not.toMatch(/^import .+ from ['"]\.\/video['"]/m)
  })
})
