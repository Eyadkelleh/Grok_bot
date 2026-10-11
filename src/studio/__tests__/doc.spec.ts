import { beforeEach, describe, expect, it } from 'vitest'
import { cle } from '../../i18n/stockage'
import {
  defaultStudioDoc,
  loadDoc,
  migrateLegacy,
  parseStudioDoc,
  saveDoc,
  serializeStudioDoc,
  STUDIO_DOC_VERSION,
  type StudioDoc,
} from '../doc'

function put(name: string, value: string) {
  window.localStorage.setItem(cle(name as 'studio'), value)
}

function get(name: string) {
  return window.localStorage.getItem(cle(name as 'studio'))
}

describe('studio doc', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('starts a fresh install on the image desk with catalogue defaults', () => {
    const doc = loadDoc()
    expect(doc.version).toBe(STUDIO_DOC_VERSION)
    expect(doc.focus).toBe('image')
    expect(doc.theme).toBe('system')
    expect(doc.image.look).toEqual({
      owner: 'image',
      shape: 'circle',
      colour: 'ink',
      expression: 'neutral',
      banner: null,
    })
    expect(doc.video.look.owner).toBe('video')
    expect(doc.video.montage.cycles).toHaveLength(1)
  })

  it('does not persist anything on a fresh load', () => {
    loadDoc()
    expect(get('studio')).toBeNull()
  })

  it('seeds both desks from the same legacy look and drops the legacy keys', () => {
    put('forme', 'droplet')
    put('couleur', 'violet')
    put('expression', 'proud')
    put('fond', 'banner-2')
    put('fondCopy', JSON.stringify({ welcome: 'Hallo', event1: 'Cursor Berlin' }))

    const doc = loadDoc()

    expect(doc.image.look).toEqual({
      owner: 'image',
      shape: 'droplet',
      colour: 'violet',
      expression: 'proud',
      banner: 'banner-2',
    })
    expect(doc.video.look).toEqual({
      owner: 'video',
      shape: 'droplet',
      colour: 'violet',
      expression: 'proud',
      banner: 'banner-2',
    })
    expect(doc.shared.bannerCopy.welcome).toBe('Hallo')
    expect(doc.shared.bannerCopy.event1).toBe('Cursor Berlin')

    expect(get('studio')).not.toBeNull()
    expect(get('forme')).toBeNull()
    expect(get('couleur')).toBeNull()
    expect(get('fondCopy')).toBeNull()
  })

  it('carries the legacy montage onto the video desk only', () => {
    put(
      'cycles',
      JSON.stringify({
        activeId: 'c1',
        cycles: [{ id: 'c1', name: 'Loop', blocks: [{ state: 'Comet', duration: 1.5 }] }],
      }),
    )

    const doc = loadDoc()

    expect(doc.video.montage.activeId).toBe('c1')
    expect(doc.video.montage.cycles[0]!.blocks).toEqual([{ state: 'Comet', duration: 1.5 }])
    expect(doc.image).not.toHaveProperty('montage')
  })

  it('is a no-op on the next load when the process died between write and cleanup', () => {
    put('forme', 'hexagon')
    const migrated = migrateLegacy((key) => get(key))!
    saveDoc(migrated)
    expect(get('forme')).toBe('hexagon')

    const doc = loadDoc()

    expect(doc.image.look.shape).toBe('hexagon')
    expect(get('forme')).toBeNull()
  })

  it('prefers an existing studio doc over stale legacy keys', () => {
    const doc = defaultStudioDoc()
    saveDoc({ ...doc, image: { ...doc.image, look: { ...doc.image.look, shape: 'cloud' } } })
    put('forme', 'triangle')

    expect(loadDoc().image.look.shape).toBe('cloud')
  })

  it('replaces unknown ids field by field instead of discarding the document', () => {
    const parsed = parseStudioDoc(
      JSON.stringify({
        version: 2,
        focus: 'video',
        theme: 'dark',
        image: { kind: 'image', look: { shape: 'star', colour: 'blue' }, pose: 'Comet' },
        video: { kind: 'video', look: { expression: 'smirk' }, pose: 'nope' },
      }),
    )!

    expect(parsed.focus).toBe('video')
    expect(parsed.theme).toBe('dark')
    expect(parsed.image.look.shape).toBe('circle')
    expect(parsed.image.look.colour).toBe('blue')
    expect(parsed.image.pose).toBe('Comet')
    expect(parsed.video.look.expression).toBe('neutral')
    expect(parsed.video.pose).toBe('Idle')
  })

  it('returns null for a corrupted document so the caller can fall back', () => {
    expect(parseStudioDoc('{ not json')).toBeNull()
    expect(parseStudioDoc('[]')).not.toBeNull()
    expect(parseStudioDoc(null)).toBeNull()
  })

  it('falls back to defaults when the stored document is unreadable', () => {
    put('studio', '{{{')
    expect(loadDoc().image.look.shape).toBe('circle')
  })

  it('rebrands each desk look on parse so a hand-edited owner cannot cross desks', () => {
    const parsed = parseStudioDoc(
      JSON.stringify({ video: { look: { owner: 'image', shape: 'cloud' } } }),
    )!
    expect(parsed.video.look.owner).toBe('video')
  })

  it('round-trips through serialize and parse', () => {
    const doc: StudioDoc = {
      ...defaultStudioDoc(),
      focus: 'video',
      theme: 'light',
      image: {
        kind: 'image',
        look: {
          owner: 'image',
          shape: 'capsule',
          colour: 'amber',
          expression: 'happy',
          banner: 'banner-3',
        },
        pose: 'Orbit',
      },
    }
    expect(parseStudioDoc(serializeStudioDoc(doc))).toEqual(doc)
  })
})
