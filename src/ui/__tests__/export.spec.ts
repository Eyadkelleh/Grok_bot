import { describe, expect, it } from 'vitest'
import { BODY_RADIUS, SHAPES, VIEW_SIZE, viewBoxAttr } from '../../engine'
import {
  ACTION_BY_ID,
  ACTION_DEFAUT,
  ACTIONS,
  BLANC,
  CYCLE_FPS,
  CYCLE_TAILLE,
  DEMI_CADRE,
  DEMI_ECRAN,
  FOND_GIF_DEFAUT,
  PNG_TAILLE,
  RAYON_MAX,
  SVG_TAILLE,
  couleurDeFond,
  cycleImages,
  cyclePas,
  nomFichier,
  sansCommentaires,
  videoPossible,
  viewBoxCycle,
  viewBoxExport,
} from '../export'

describe('export catalogue', () => {
  it('offers SVG and PNG stills plus GIF and MP4 of the montage', () => {
    expect(ACTIONS.map((a) => a.id)).toEqual(['png', 'svg', 'gif', 'mp4'])
    expect(new Set(ACTIONS.map((a) => a.id)).size).toBe(ACTIONS.length)
    expect(ACTION_BY_ID.get('png')?.mode).toBe('telecharge')
    expect(ACTION_BY_ID.get('svg')?.mode).toBe('telecharge')
    expect(ACTION_BY_ID.get('gif')?.mode).toBe('montage')
    expect(ACTION_BY_ID.get('mp4')?.mode).toBe('montage')
    expect(ACTION_BY_ID.get(ACTION_DEFAUT)?.extension).toBe('png')
  })

  it('gives PNG one size that covers profile-picture specs', () => {
    const pngs = ACTIONS.filter((a) => a.extension === 'png')
    expect(pngs).toHaveLength(1)
    expect(pngs[0]?.taille).toBe(PNG_TAILLE)
    expect(PNG_TAILLE).toBe(1024)
  })

  it('sizes the SVG from the on-screen viewBox', () => {
    expect(viewBoxExport()).toBe(viewBoxAttr())
    expect(viewBoxExport()).toBe('-72.68 -72.68 145.36 145.36')
    expect(SVG_TAILLE).toBe(VIEW_SIZE)
    expect(ACTION_BY_ID.get('svg')?.taille).toBe(SVG_TAILLE)
  })

  /**
   * G4 keep-stage-box: stills keep the stage, not bloub's tight DEMI_CADRE.
   * Cycles take the screen box so décor rings are not cropped. The two stay
   * distinct even while G4 holds the still default on the stage.
   */
  it('keeps stills on the stage box and cycles on the screen box', () => {
    const RAYON_ARCS = 1.4 * BODY_RADIUS
    expect(viewBoxExport()).toBe(viewBoxAttr())
    expect(viewBoxExport()).not.toBe(viewBoxExport(DEMI_CADRE))
    expect(viewBoxCycle()).toBe(viewBoxExport(DEMI_ECRAN))
    expect(viewBoxCycle()).toBe(viewBoxAttr())
    expect(DEMI_ECRAN).toBeGreaterThan(RAYON_ARCS)
    expect(DEMI_CADRE).toBeLessThan(RAYON_ARCS)
    expect(viewBoxExport(125)).toBe('-125 -125 250 250')
  })

  it('fits every customiser shape inside the tight cadre', () => {
    expect(RAYON_MAX).toBe(Math.max(...SHAPES.map((forme) => Math.max(...forme.radii))))
    expect(RAYON_MAX).toBeGreaterThan(1)
    for (const forme of SHAPES) {
      const rayon = Math.max(...forme.radii) * BODY_RADIUS
      expect(rayon, forme.id).toBeLessThan(DEMI_CADRE)
    }
  })

  it('keeps GIF cheap and MP4 sharp', () => {
    expect(CYCLE_FPS.gif).toBe(20)
    expect(CYCLE_FPS.mp4).toBe(30)
    expect(CYCLE_TAILLE.gif).toBe(320)
    expect(CYCLE_TAILLE.mp4).toBe(1024)
    expect(cyclePas('gif')).toBe(1 / 20)
    expect(cyclePas('mp4')).toBe(1 / 30)
    expect(cycleImages(2, 'gif')).toBe(40)
    expect(cycleImages(2, 'mp4')).toBe(60)
    expect(cycleImages(0, 'gif')).toBe(1)
    expect(ACTION_BY_ID.get('gif')?.taille).toBe(CYCLE_TAILLE.gif)
    expect(ACTION_BY_ID.get('mp4')?.taille).toBe(CYCLE_TAILLE.mp4)
  })

  it('paints a white matte under video and default GIF', () => {
    expect(FOND_GIF_DEFAUT).toBe('blanc')
    expect(couleurDeFond('blanc')).toBe(BLANC)
    expect(couleurDeFond('transparent')).toBeNull()
  })

  it('does not load mediabunny to ask whether video is possible', () => {
    expect(typeof videoPossible()).toBe('boolean')
  })
})

describe('markup cleanup', () => {
  it('strips comments and leaves the drawing alone', () => {
    const markup = '<svg><!-- mask note --><path d="M0 0Z"/></svg>'
    expect(sansCommentaires(markup)).toBe('<svg><path d="M0 0Z"/></svg>')
    expect(sansCommentaires('<svg><path d="M0 0Z"/></svg>')).toBe('<svg><path d="M0 0Z"/></svg>')
  })
})

describe('filename', () => {
  it('is built from the state id, not a translated label', () => {
    expect(nomFichier('Idle', 'png')).toBe('grok-bot-idle.png')
    expect(nomFichier('WideEyes', 'svg')).toBe('grok-bot-wideeyes.svg')
    expect(nomFichier('Thinking', 'png')).toBe('grok-bot-thinking.png')
    expect(nomFichier('Default cycle', 'gif')).toBe('grok-bot-default-cycle.gif')
    expect(nomFichier('Default cycle', 'mp4')).toBe('grok-bot-default-cycle.mp4')
  })

  it('does not let a path separator through', () => {
    const nom = nomFichier('../../etc/passwd', 'png')
    expect(nom).not.toContain('/')
    expect(nom.split('.')).toHaveLength(2)
    expect(nom.endsWith('.png')).toBe(true)
  })

  it('survives an empty id', () => {
    expect(nomFichier('', 'svg')).toBe('grok-bot.svg')
  })
})
