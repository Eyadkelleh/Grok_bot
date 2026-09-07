import { describe, expect, it, vi } from 'vitest'
import { makeBlock } from '../../engine'
import { exporte, ouvreCycle, svgAutonome, telecharge } from '../capture'
import { viewBoxExport } from '../export'

function svgDeTest() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', '-50 -50 100 100')
  svg.setAttribute('class', 'avatar')
  svg.setAttribute('data-state', 'Idle')
  svg.setAttribute('data-target', 'Idle')
  svg.setAttribute('data-v-test', '')
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  path.setAttribute('d', 'M10 0C10 5.5 5.5 10 0 10Z')
  path.setAttribute('fill', '#111111')
  path.setAttribute('class', 'body')
  svg.appendChild(path)
  return svg
}

describe('svgAutonome', () => {
  it('serialises the live drawing into a standalone SVG', () => {
    const markup = svgAutonome(svgDeTest(), 100)
    expect(markup).toContain('xmlns="http://www.w3.org/2000/svg"')
    expect(markup).toContain('width="100"')
    expect(markup).toContain('height="100"')
    expect(markup).toContain('viewBox="-50 -50 100 100"')
    expect(markup).toContain('M10 0C10 5.5 5.5 10 0 10Z')
    expect(markup).toContain('fill="#111111"')
    expect(markup).toContain(viewBoxExport())
  })

  it('strips page classes and Vue bookkeeping from the file', () => {
    const markup = svgAutonome(svgDeTest(), 1024)
    expect(markup).not.toContain('class=')
    expect(markup).not.toContain('data-')
    expect(markup).toContain('width="1024"')
  })

  it('rewrites the live mask id so the file is self-contained', () => {
    const svg = svgDeTest()
    const mask = document.createElementNS('http://www.w3.org/2000/svg', 'mask')
    mask.setAttribute('id', 'avatar-mask-live')
    svg.appendChild(mask)
    const body = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    body.setAttribute('mask', 'url(#avatar-mask-live)')
    svg.appendChild(body)
    const markup = svgAutonome(svg, 100)
    expect(markup).toContain('id="grok-bot-mask"')
    expect(markup).toContain('url(#grok-bot-mask)')
    expect(markup).not.toContain('avatar-mask-live')
  })
})

describe('telecharge', () => {
  it('clicks an anchor whose download name is the given filename', () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    telecharge(new Blob(['<svg/>'], { type: 'image/svg+xml' }), 'grok-bot-idle.svg')
    expect(click).toHaveBeenCalledOnce()
    click.mockRestore()
  })
})

describe('exporte', () => {
  it('downloads an SVG named from the state id', async () => {
    const names: string[] = []
    const create = document.createElement.bind(document)
    const createSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName, options) => {
      const el = create(tagName, options)
      if (tagName === 'a') {
        const ancre = el as HTMLAnchorElement
        ancre.click = () => {
          names.push(ancre.download)
        }
      }
      return el
    })
    await exporte(svgDeTest(), 'svg', 'Idle')
    expect(names).toEqual(['grok-bot-idle.svg'])
    createSpy.mockRestore()
  })

  it('refuses GIF and MP4 on the still path', async () => {
    await expect(exporte(svgDeTest(), 'gif', 'Idle')).rejects.toThrow(/unknown export/)
    await expect(exporte(svgDeTest(), 'mp4', 'Idle')).rejects.toThrow(/unknown export/)
  })
})

describe('ouvreCycle', () => {
  const reglages = { shape: 'circle', colour: 'ink', expression: 'neutral' }

  it('opens on the first block, settled, then morphs at the joint', async () => {
    const blocs = [makeBlock('Idle', 2), makeBlock('Thinking', 2)]
    const lecteur = await ouvreCycle(reglages, blocs, 100)
    const t0 = await lecteur.rendre(0)
    expect(t0.getAttribute('data-state')).toBe('Idle')
    expect(t0.getAttribute('data-target')).toBe('Idle')
    expect(t0.querySelectorAll('[data-eye]')).toHaveLength(2)

    const joint = await lecteur.rendre(2)
    expect(joint.getAttribute('data-target')).toBe('Thinking')
    expect(joint.getAttribute('data-state')).toBe('Idle')

    const landed = await lecteur.rendre(2.4)
    expect(landed.getAttribute('data-state')).toBe('Thinking')
    expect(landed.getAttribute('data-target')).toBe('Thinking')
    expect(landed.querySelectorAll('[data-dot]')).toHaveLength(2)
    expect(landed.querySelectorAll('[data-eye]')).toHaveLength(0)

    const rewind = await lecteur.rendre(0)
    expect(rewind.getAttribute('data-state')).toBe('Idle')
    expect(rewind.getAttribute('data-target')).toBe('Idle')
    lecteur.ferme()
  })
})
