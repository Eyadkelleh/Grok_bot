import { describe, expect, it } from 'vitest'
import { VIEW_SIZE, viewBoxAttr } from '../../engine'
import {
  ACTION_BY_ID,
  ACTION_DEFAUT,
  ACTIONS,
  BLANC,
  CYCLE_FPS,
  CYCLE_TAILLE,
  FOND_GIF_DEFAUT,
  PNG_TAILLE,
  SVG_TAILLE,
  couleurDeFond,
  cycleImages,
  cyclePas,
  nomFichier,
  sansCommentaires,
  videoPossible,
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
