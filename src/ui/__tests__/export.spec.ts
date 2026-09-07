import { describe, expect, it } from 'vitest'
import { viewBoxAttr } from '../../engine'
import {
  ACTION_BY_ID,
  ACTION_DEFAUT,
  ACTIONS,
  PNG_TAILLE,
  SVG_TAILLE,
  nomFichier,
  sansCommentaires,
  viewBoxExport,
} from '../export'

describe('still catalogue', () => {
  it('offers unique SVG and PNG downloads and no motion formats', () => {
    expect(ACTIONS.map((a) => a.id)).toEqual(['png', 'svg'])
    expect(new Set(ACTIONS.map((a) => a.id)).size).toBe(ACTIONS.length)
    expect(ACTIONS.every((a) => a.mode === 'telecharge')).toBe(true)
    expect(ACTIONS.some((a) => a.extension === 'gif')).toBe(false)
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
    expect(viewBoxExport()).toBe('-50 -50 100 100')
    expect(SVG_TAILLE).toBe(100)
    expect(ACTION_BY_ID.get('svg')?.taille).toBe(SVG_TAILLE)
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
