import { afterEach, describe, expect, it } from 'vitest'
import { ANIMATION_STATES } from '../states'
import {
  ecrireHash,
  fragmentPour,
  lireHash,
  slugOf,
  stateFromSlug,
  STATE_SLUGS,
} from '../hash'

afterEach(() => {
  history.replaceState(null, '', '/')
})

describe('hash routing', () => {
  it('maps every catalogue state to a bloub-style slug', () => {
    expect(slugOf('Idle')).toBe('idle')
    expect(slugOf('WideEyes')).toBe('wide')
    expect(slugOf('Notification')).toBe('notify')
    expect(slugOf('Exclamation')).toBe('exclaim')
    expect(Object.keys(STATE_SLUGS)).toEqual([...ANIMATION_STATES])
  })

  it('accepts bloub slugs, PascalCase ids, and lowercase aliases', () => {
    expect(stateFromSlug('idle')).toBe('Idle')
    expect(stateFromSlug('wide')).toBe('WideEyes')
    expect(stateFromSlug('wideeyes')).toBe('WideEyes')
    expect(stateFromSlug('WideEyes')).toBe('WideEyes')
    expect(stateFromSlug('notify')).toBe('Notification')
    expect(stateFromSlug('notification')).toBe('Notification')
    expect(stateFromSlug('exclaim')).toBe('Exclamation')
    expect(stateFromSlug('swirl')).toBeNull()
    expect(stateFromSlug(null)).toBeNull()
  })

  it('builds #etat= fragments and optional &stop', () => {
    expect(fragmentPour('Idle', true)).toBe('#etat=idle')
    expect(fragmentPour('Thinking', false)).toBe('#etat=thinking&stop')
    expect(fragmentPour('Orbit', false)).toBe('#etat=orbit&stop')
  })

  it('reads a named state from the hash and ignores unknown ones', () => {
    expect(lireHash('#etat=thinking')).toEqual({
      state: 'Thinking',
      named: true,
      playing: true,
    })
    expect(lireHash('#etat=comet&stop')).toEqual({
      state: 'Comet',
      named: true,
      playing: false,
    })
    expect(lireHash('#customise')).toEqual({
      state: 'Idle',
      named: false,
      playing: true,
    })
    expect(lireHash('')).toEqual({
      state: 'Idle',
      named: false,
      playing: true,
    })
  })

  it('writes the current pose with replaceState so history stays quiet', () => {
    expect(ecrireHash('Idle', false)).toBe('#etat=idle&stop')
    expect(location.hash).toBe('#etat=idle&stop')
    expect(ecrireHash('Burst', true)).toBe('#etat=burst')
    expect(location.hash).toBe('#etat=burst')
  })
})
