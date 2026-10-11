import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import OutputDock from '../components/OutputDock.vue'
import { resolveChromeAccent } from '../ui/chromeAccent'

describe('OutputDock', () => {
  it('tints desk icons through resolveChromeAccent display hex', () => {
    const wrapper = mount(OutputDock, {
      props: {
        focus: 'image',
        imageColour: 'ink',
        videoColour: 'blue',
        videoDuration: 2,
      },
    })
    const ink = resolveChromeAccent('ink')
    const blue = resolveChromeAccent('blue')
    expect(ink.sourceHex).toBe('#0a0a0c')
    expect(ink.displayHex).not.toBe('#0a0a0c')
    const imageTint = wrapper.get('[data-desk="image"] .tint').element as SVGCircleElement
    const videoTint = wrapper.get('[data-desk="video"] .tint').element as SVGCircleElement
    expect(imageTint.style.fill).toBe(`rgb(${ink.rgb.join(', ')})`)
    expect(videoTint.style.fill).toBe(`rgb(${blue.rgb.join(', ')})`)
    expect(wrapper.get('[data-desk="image"]').classes()).toContain('on')
  })

  it('selects the active desk with shared accent tokens', () => {
    const src = readFileSync(join(process.cwd(), 'src/components/OutputDock.vue'), 'utf8')
    expect(src).toMatch(/resolveChromeAccent/)
    expect(src).toMatch(/\.sheet\.on/)
    expect(src).toMatch(/var\(--accent-soft\)/)
    expect(src).toMatch(/var\(--accent-display\)/)
    expect(src).not.toMatch(/COLOR_BY_ID/)
  })
})
