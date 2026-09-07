import { describe, expect, it } from 'vitest'
import { interpoler } from '../i18n/format'
import { choisirLangue, LANGUES, tagDe } from '../i18n/langues'
import { langue, rechargerLangue, secondes } from '../i18n'
import en from '../i18n/locales/en'
import fr from '../i18n/locales/fr'
import zh from '../i18n/locales/zh'

const DICTIONNAIRES = { fr, en, zh }

function feuilles(objet: object, prefixe = ''): Array<[string, string]> {
  return Object.entries(objet).flatMap(([cle, valeur]) =>
    typeof valeur === 'string'
      ? [[`${prefixe}${cle}`, valeur] as [string, string]]
      : feuilles(valeur as object, `${prefixe}${cle}.`),
  )
}

describe('startup language', () => {
  it('keeps a stored choice over browser preferences', () => {
    expect(choisirLangue('en', ['fr-FR', 'fr'])).toBe('en')
    expect(choisirLangue('zh', ['fr-FR'])).toBe('zh')
  })

  it('ignores a stored value that is not a known language', () => {
    expect(choisirLangue('de', ['fr-FR'])).toBe('fr')
    expect(choisirLangue('', ['zh-CN'])).toBe('zh')
  })

  it('follows browser preference order', () => {
    expect(choisirLangue(null, ['zh-CN', 'en-US', 'fr'])).toBe('zh')
    expect(choisirLangue(null, ['en-US', 'zh-CN', 'fr'])).toBe('en')
  })

  it('reduces a full tag to its language', () => {
    expect(choisirLangue(null, ['zh-Hans-CN'])).toBe('zh')
    expect(choisirLangue(null, ['en-GB-oxendict'])).toBe('en')
  })

  it('skips unknown languages and invalid tags', () => {
    expect(choisirLangue(null, ['de-DE', 'ja', 'en'])).toBe('en')
    expect(choisirLangue(null, ['not a tag', 'zh'])).toBe('zh')
  })

  it('falls back to English when nothing matches', () => {
    expect(choisirLangue(null, ['de-DE', 'ja-JP'])).toBe('en')
    expect(choisirLangue(null, [])).toBe('en')
  })
})

describe('dictionaries', () => {
  it('has no empty value in any language', () => {
    for (const [langue, dico] of Object.entries(DICTIONNAIRES)) {
      for (const [cle, valeur] of feuilles(dico)) {
        expect(valeur.trim(), `${langue}.${cle}`).not.toBe('')
      }
    }
  })

  it('translates settings copy instead of copying French', () => {
    for (const [cle, valeur] of feuilles(fr.settings)) {
      expect(feuilles(en.settings).find(([k]) => k === cle)![1], `en ${cle}`).not.toBe(
        valeur,
      )
      expect(feuilles(zh.settings).find(([k]) => k === cle)![1], `zh ${cle}`).not.toBe(
        valeur,
      )
    }
  })
})

describe('substitution', () => {
  it('replaces every occurrence of a parameter', () => {
    expect(interpoler('{a} et {a}', { a: 'x' })).toBe('x et x')
  })

  it('leaves a missing parameter visible', () => {
    expect(interpoler('Independent recreation of {name} (MIT).', {})).toBe(
      'Independent recreation of {name} (MIT).',
    )
  })
})

describe('language catalogue', () => {
  it('offers the three languages with a flag and an endonym', () => {
    expect(LANGUES.map((l) => l.id)).toEqual(['en', 'fr', 'zh'])
    for (const l of LANGUES) {
      expect(l.emoji.length, l.id).toBeGreaterThan(0)
      expect(l.nom.trim(), l.id).not.toBe('')
    }
  })

  it('gives Chinese a script subtag', () => {
    expect(tagDe('zh')).toBe('zh-Hans')
  })
})

describe('units', () => {
  it('formats seconds with the active locale', () => {
    rechargerLangue()
    langue.value = 'en'
    expect(secondes(1.5)).toBe('1.5 s')
    langue.value = 'fr'
    expect(secondes(1.5)).toBe('1,5 s')
  })
})
