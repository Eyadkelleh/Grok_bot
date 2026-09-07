import { describe, expect, it } from 'vitest'
import { svgAutonome } from '../ui/capture'
import { VISUAL_CASES } from '../testing/visual/cases'
import { dumpVisualCases } from '../testing/visual/dump'
import { expectSvgGolden, formatSvg, quantiseSvgNumbers, wantsSvg } from '../testing/visual/golden'
import { mountCase } from '../testing/visual/mount'
import { frameForCase } from '../testing/visual/picture'

const dumpDir = process.env.VISUAL_DUMP

describe.each(VISUAL_CASES)('$id — $what', (visualCase) => {
  it('renders the specified structure', async () => {
    const wrapper = await mountCase(visualCase)
    const svg = wrapper.get('svg')
    const target = visualCase.expect.target ?? visualCase.expect.state
    expect(svg.attributes('data-state'), visualCase.id).toBe(visualCase.expect.state)
    expect(svg.attributes('data-target'), visualCase.id).toBe(target)

    const mask = wrapper.get('mask')
    const maskId = mask.attributes('id')
    expect(maskId).toMatch(/^avatar-mask-/)
    expect(wrapper.get('g').attributes('mask')).toBe(`url(#${maskId})`)
    expect(mask.get('path').attributes('fill')).toBe('#fff')

    const maskEyes = mask.findAll('[data-eye]')
    expect(maskEyes, visualCase.id).toHaveLength(visualCase.expect.eyes)
    expect(wrapper.findAll('[data-eye]'), visualCase.id).toHaveLength(visualCase.expect.eyes)
    for (const eye of maskEyes) {
      expect(eye.attributes('fill')).toBe('#000')
    }

    expect(wrapper.findAll('[data-dot]'), visualCase.id).toHaveLength(visualCase.expect.dots)

    const oracle = frameForCase(visualCase)
    expect(wrapper.get('[data-body-paper]').attributes('d'), visualCase.id).toBe(oracle.path)
    expect(mask.get('path').attributes('d'), visualCase.id).toBe(oracle.path)

    if (visualCase.expect.face === 'morphing') {
      expect(maskEyes, visualCase.id).toHaveLength(0)
    }

    if (wantsSvg(visualCase)) {
      const node = svg.element as unknown as SVGSVGElement
      const size = Number(node.getAttribute('width') ?? 220)
      await expectSvgGolden(formatSvg(quantiseSvgNumbers(svgAutonome(node, size))), visualCase)
    }

    wrapper.unmount()
  })
})

describe.skipIf(!dumpDir)('visual dump', () => {
  it('writes svgAutonome snapshots for every case', async () => {
    await dumpVisualCases(dumpDir!)
  })
})
