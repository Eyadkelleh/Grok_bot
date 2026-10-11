import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  AvatarEngine,
  DEFAULT_MORPH_MS,
  blockAt,
  makeBlock,
  offsetOf,
  viewBoxAttr,
  type AvatarFrame,
  type Block,
} from '../../engine'
import { dessine, exporte, ouvreCycle, svgAutonome, telecharge } from '../capture'
import { BLANC, DEMI_CADRE, DEMI_ECRAN, viewBoxCycle, viewBoxExport } from '../export'
import { matteEstOpaque } from '../matte'

function svgDeTest() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', viewBoxAttr())
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
    expect(markup).toContain(`viewBox="${viewBoxAttr()}"`)
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

  it('keeps still crop on the stage viewBox, not a tight cadre', () => {
    const markup = svgAutonome(svgDeTest(), 1024)
    expect(viewBoxExport()).toBe(viewBoxAttr())
    expect(markup).toContain(`viewBox="${viewBoxAttr()}"`)
    expect(markup).toContain('viewBox="-72.68 -72.68 145.36 145.36"')
    expect(markup).not.toContain(`viewBox="${viewBoxExport(DEMI_CADRE)}"`)
  })

  it('serialises a cycle frame on the screen box, not the tight cadre', () => {
    const markup = svgAutonome(svgDeTest(), 320, viewBoxCycle())
    expect(markup).toContain(`viewBox="${viewBoxExport(DEMI_ECRAN)}"`)
    expect(markup).toContain(`viewBox="${viewBoxAttr()}"`)
    expect(markup).not.toContain(`viewBox="${viewBoxExport(DEMI_CADRE)}"`)
  })
})

describe('dessine', () => {
  /**
   * jsdom's canvas is a stub: fillRect does not write pixels. The mock below
   * is a known transparent stage plus a working 2d context, so a missing
   * matte fails on alpha rather than on a silent no-op.
   */
  function toileLogicielle() {
    const store = { data: new Uint8ClampedArray(0) }
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (
      this: HTMLCanvasElement,
      type: string,
    ) {
      if (type !== '2d') return null
      const cote = this.width
      store.data = new Uint8ClampedArray(cote * cote * 4)
      const data = store.data
      return {
        fillStyle: '#000000',
        clearRect() {
          data.fill(0)
        },
        fillRect() {
          const fond = String(this.fillStyle)
          const n = Number.parseInt(fond.slice(1), 16)
          const r = (n >> 16) & 0xff
          const v = (n >> 8) & 0xff
          const b = n & 0xff
          for (let i = 0; i < data.length; i += 4) {
            data[i] = r
            data[i + 1] = v
            data[i + 2] = b
            data[i + 3] = 255
          }
        },
        drawImage() {},
        getImageData() {
          return { data, width: cote, height: cote }
        },
        putImageData(image: ImageData) {
          data.set(image.data)
        },
      } as unknown as CanvasRenderingContext2D
    })
    return store
  }

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('fails if a required GIF/MP4 matte stays fully transparent', async () => {
    vi.stubGlobal(
      'Image',
      class {
        src = ''
        decode() {
          return Promise.resolve()
        }
      },
    )
    const store = toileLogicielle()
    const canvas = document.createElement('canvas')
    const ctx = await dessine('<svg xmlns="http://www.w3.org/2000/svg"/>', 8, canvas, BLANC)
    const px = ctx.getImageData(0, 0, 8, 8).data
    expect(store.data).toBe(px)
    expect(matteEstOpaque(px)).toBe(true)
    expect(px[3]).toBe(255)
    expect(px[0]).toBe(255)
    expect(px[px.length - 1]).toBe(255)
  })

  it('leaves still rasterisation transparent when no fill is asked', async () => {
    vi.stubGlobal(
      'Image',
      class {
        src = ''
        decode() {
          return Promise.resolve()
        }
      },
    )
    toileLogicielle()
    const canvas = document.createElement('canvas')
    const ctx = await dessine('<svg xmlns="http://www.w3.org/2000/svg"/>', 8, canvas, null)
    expect(ctx.getImageData(0, 0, 8, 8).data[3]).toBe(0)
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

const REGLAGES = { shape: 'circle', colour: 'ink', expression: 'neutral' }

/** Body `d` as the off-screen Avatar put it in the mask. */
function corpsDe(svg: SVGSVGElement) {
  return svg.querySelector('mask path')!.getAttribute('d')!
}

function yeuxDe(svg: SVGSVGElement) {
  return [...svg.querySelectorAll('mask [data-eye]')].map((el) => ({
    transform: el.getAttribute('transform') ?? '',
    rx: el.getAttribute('rx') ?? '',
    ry: el.getAttribute('ry') ?? '',
    opacity: el.getAttribute('opacity') ?? '',
  }))
}

function yeuxAttendus(frame: AvatarFrame) {
  return frame.eyes.map((eye) => ({
    transform: `translate(${eye.x} ${eye.y}) matrix(${eye.a} ${eye.b} ${eye.c} ${eye.d} 0 0) rotate(${eye.tilt})`,
    rx: String(eye.rx),
    ry: String(eye.ry),
    opacity: String(eye.opacity),
  }))
}

/**
 * Engine alone, dated the way a live clock would: each block's state is stamped
 * at its absolute offset, then `sample(t)` is the frame at that montage date.
 */
function moteurAuMemeInstant(blocs: Block[], t: number) {
  const e = new AvatarEngine(
    {
      state: blocs[0]!.state,
      shape: REGLAGES.shape,
      expression: REGLAGES.expression,
      colour: REGLAGES.colour,
    },
    DEFAULT_MORPH_MS,
  )
  const { index } = blockAt(blocs, t)
  for (let i = 1; i <= index; i++) e.setState(blocs[i]!.state, offsetOf(blocs, i))
  return e.sample(t)
}

function datesDesJointures(blocs: Block[]) {
  return blocs.flatMap((b, i) => {
    const debut = offsetOf(blocs, i)
    return i === 0 ? [debut + b.duration / 2] : [debut, debut + b.duration / 2]
  })
}

function montageJoints(): Block[] {
  return [
    makeBlock('Idle', 2),
    makeBlock('Orbit', 2),
    makeBlock('Thinking', 2),
    makeBlock('Sleep', 2),
    makeBlock('Comet', 2),
    makeBlock('Egg', 2),
  ]
}

describe('ouvreCycle', () => {
  /**
   * Cycle framing must be the box the Avatar draws, not a number that looks
   * like it. If someone widens the stage for bigger décor rings, cycle export
   * has to follow — otherwise every GIF/MP4 grows empty bands with tests still
   * green. Compare to the live attribute, not to DEMI_ECRAN vs itself.
   */
  it('exports the cycle on the viewBox the component draws', async () => {
    const blocs = [makeBlock('Idle', 2), makeBlock('Orbit', 2)]
    const lecteur = await ouvreCycle(REGLAGES, blocs, 128)
    try {
      const svg = await lecteur.rendre(0)
      expect(svg.getAttribute('viewBox')).toBe(viewBoxCycle())
      expect(svg.getAttribute('viewBox')).toBe(viewBoxExport(DEMI_ECRAN))
      expect(svgAutonome(svg, 320, viewBoxCycle())).toContain(`viewBox="${viewBoxAttr()}"`)
    } finally {
      lecteur.ferme()
    }
  })

  it('opens on the first block, settled, then morphs at the joint', async () => {
    const blocs = [makeBlock('Idle', 2), makeBlock('Thinking', 2)]
    const lecteur = await ouvreCycle(REGLAGES, blocs, 100)
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
    expect(corpsDe(rewind)).toBe(moteurAuMemeInstant(blocs, 0).path)
    expect(yeuxDe(rewind)).toEqual(yeuxAttendus(moteurAuMemeInstant(blocs, 0)))
    expect(rewind.getAttribute('viewBox')).toBe(viewBoxCycle())
    lecteur.ferme()
  })

  /**
   * The exported frame must be the engine's, including ON a block joint.
   *
   * Joints are where capture used to lie: a watcher or a frozen clock at 0
   * would sample the outgoing pose after the incoming state was already dated.
   * GIF/MP4 step through every joint, so a mismatch is a wrong frame in the
   * file, not a skipped unit test.
   */
  it('renders exactly what the engine samples, joints included', async () => {
    const blocs = montageJoints()
    const lecteur = await ouvreCycle(REGLAGES, blocs, 128)
    try {
      for (const t of datesDesJointures(blocs)) {
        const svg = await lecteur.rendre(t)
        const attendu = moteurAuMemeInstant(blocs, t)
        const seeker = new AvatarEngine(
          {
            state: blocs[0]!.state,
            shape: REGLAGES.shape,
            expression: REGLAGES.expression,
            colour: REGLAGES.colour,
          },
          DEFAULT_MORPH_MS,
        )
        const localT = seeker.seek(t, blocs)
        const sought = seeker.sample(localT)
        expect(sought.path, `seek path t=${t}`).toBe(attendu.path)
        expect(yeuxAttendus(sought), `seek eyes t=${t}`).toEqual(yeuxAttendus(attendu))
        expect(corpsDe(svg), `path t=${t}`).toBe(attendu.path)
        expect(yeuxDe(svg), `eyes t=${t}`).toEqual(yeuxAttendus(attendu))
        expect(svg.getAttribute('viewBox'), `viewBox t=${t}`).toBe(viewBoxCycle())
        expect(svgAutonome(svg, 320, viewBoxCycle())).toContain(`viewBox="${viewBoxCycle()}"`)
      }
    } finally {
      lecteur.ferme()
    }
  })

  /**
   * GIF encoding walks the montage twice. The second pass must redraw frame 0
   * as the first block, not as the last block's leftover previous-state.
   */
  it('replays the sequence identically after a full pass', async () => {
    const blocs = montageJoints()
    const neuf = await ouvreCycle(REGLAGES, blocs, 128)
    const reference = {
      corps: corpsDe(await neuf.rendre(0)),
      yeux: yeuxDe(await neuf.rendre(0)),
    }
    neuf.ferme()

    const rejoue = await ouvreCycle(REGLAGES, blocs, 128)
    try {
      for (let t = 0; t < 12; t += 1.5) await rejoue.rendre(t)
      const apres = await rejoue.rendre(0)
      const attendu = moteurAuMemeInstant(blocs, 0)
      expect(corpsDe(apres)).toBe(reference.corps)
      expect(yeuxDe(apres)).toEqual(reference.yeux)
      expect(yeuxDe(apres)).toHaveLength(2)
      expect(corpsDe(apres)).toBe(attendu.path)
      expect(yeuxDe(apres)).toEqual(yeuxAttendus(attendu))
      expect(apres.getAttribute('viewBox')).toBe(viewBoxCycle())
    } finally {
      rejoue.ferme()
    }
  })

  /**
   * Frame 0 is the first montage state, settled — not Idle morphing into it.
   */
  it('opens on the first montage state without morphing in from Idle', async () => {
    for (const debut of ['Orbit', 'Egg', 'Play'] as const) {
      const blocs = [makeBlock(debut, 2), makeBlock('Idle', 2)]
      const lecteur = await ouvreCycle(REGLAGES, blocs, 128)
      try {
        const svg = await lecteur.rendre(0)
        expect(corpsDe(svg), debut).toBe(moteurAuMemeInstant(blocs, 0).path)
      } finally {
        lecteur.ferme()
      }
    }
  })
})
