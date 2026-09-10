import { describe, expect, it } from 'vitest'
import en from '../../i18n/locales/en'
import fr from '../../i18n/locales/fr'
import zh from '../../i18n/locales/zh'
import { VERBS, type VerbId } from '../verbs'

const IDS: readonly VerbId[] = ['shape', 'expression', 'colour', 'pose']

function leaf(dict: typeof fr, key: string): string {
  return key.split('.').reduce<unknown>((node, part) => {
    return (node as Record<string, unknown>)[part]
  }, dict) as string
}

describe('VERBS', () => {
  it('maps each band to one data-mode, label, rail slot, and peek attribute', () => {
    expect(Object.keys(VERBS).sort()).toEqual([...IDS].sort())
    expect(VERBS.shape).toEqual({
      id: 'shape',
      dataMode: 'shape',
      labelKey: 'studio.shape',
      railIndex: 0,
      peekAttr: 'data-shape',
    })
    expect(VERBS.expression).toEqual({
      id: 'expression',
      dataMode: 'expression',
      labelKey: 'studio.face',
      railIndex: 1,
      peekAttr: 'data-expression',
    })
    expect(VERBS.colour).toEqual({
      id: 'colour',
      dataMode: 'colour',
      labelKey: 'studio.aura',
      railIndex: 2,
      peekAttr: 'data-colour',
    })
    expect(VERBS.pose).toEqual({
      id: 'pose',
      dataMode: 'state',
      labelKey: 'studio.motion',
      railIndex: 3,
      peekAttr: 'data-state',
    })
  })

  it('keeps Motion on data-mode=state while the band stays pose', () => {
    expect(VERBS.pose.id).toBe('pose')
    expect(VERBS.pose.dataMode).toBe('state')
    expect(VERBS.pose.peekAttr).toBe('data-state')
  })

  it('assigns unique rail indices in landmark order', () => {
    const ordered = IDS.map((id) => VERBS[id])
    expect(ordered.map((verb) => verb.railIndex)).toEqual([0, 1, 2, 3])
    expect(new Set(ordered.map((verb) => verb.railIndex)).size).toBe(4)
    expect(new Set(ordered.map((verb) => verb.dataMode)).size).toBe(4)
    expect(new Set(ordered.map((verb) => verb.peekAttr)).size).toBe(4)
  })

  it('points label keys at copy that exists in en, fr, and zh', () => {
    for (const id of IDS) {
      const key = VERBS[id].labelKey
      expect(leaf(en, key).length).toBeGreaterThan(0)
      expect(leaf(fr, key).length).toBeGreaterThan(0)
      expect(leaf(zh, key).length).toBeGreaterThan(0)
    }
  })
})
