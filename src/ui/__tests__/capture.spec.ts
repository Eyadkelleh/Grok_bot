import { describe, expect, it, vi } from 'vitest'
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
import { exporte, ouvreCycle, svgAutonome, telecharge } from '../capture'
import { viewBoxExport } from '../export'

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
      expect(corpsDe(apres)).toBe(reference.corps)
      expect(yeuxDe(apres)).toEqual(reference.yeux)
      expect(yeuxDe(apres)).toHaveLength(2)
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
