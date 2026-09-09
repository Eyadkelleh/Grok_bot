import { describe, expect, it } from 'vitest'
import {
  CADRE_BANNER_PNG,
  isBannerId,
  mesureScene,
  rectangleContain,
  rectangleCover,
  sceneBanniere,
  sceneDepuisFondGif,
} from '../scene'

describe('scene', () => {
  it('covers a tall banner into a square by cropping height', () => {
    const c = rectangleCover(1800, 5400, 1024, 1024)
    expect(c.sw).toBeCloseTo(1800)
    expect(c.sh).toBeCloseTo(1800)
    expect(c.sy).toBeCloseTo(1800)
  })

  it('contains a tall banner into a portrait frame without crop', () => {
    const c = rectangleContain(1800, 5400, 600, 1800)
    expect(c.dw).toBeCloseTo(600)
    expect(c.dh).toBeCloseTo(1800)
    expect(c.dx).toBeCloseTo(0)
    expect(c.dy).toBeCloseTo(0)
  })

  it('maps logo slot into the portrait output', () => {
    const scene = sceneBanniere(
      'banner-2',
      CADRE_BANNER_PNG,
      {
        welcome: 'Welcome',
        event1: 'Demo',
        event2: '',
        presentedBy: 'Presented by',
      },
    )
    const m = mesureScene(scene)
    expect(m.logo.w).toBeGreaterThan(0)
    expect(m.logo.y).toBeGreaterThan(m.welcome.y)
    expect(m.event.y).toBeGreaterThan(m.logo.y)
    expect(m.wordmark.y).toBeGreaterThan(m.presentedBy.y)
  })

  it('builds blanc/transparent scenes from FondGif', () => {
    const blanc = sceneDepuisFondGif('blanc', { fit: 'cover', width: 320, height: 320 })
    expect(blanc.fond).toEqual({ kind: 'aplat', hex: '#ffffff' })
    const clear = sceneDepuisFondGif('transparent', { fit: 'cover', width: 320, height: 320 })
    expect(clear.fond).toEqual({ kind: 'vide' })
  })

  it('narrows banner ids at the boundary', () => {
    expect(isBannerId('banner-01')).toBe(true)
    expect(isBannerId('banner-2')).toBe(true)
    expect(isBannerId('banner-3')).toBe(true)
    expect(isBannerId('aucun')).toBe(false)
  })
})
