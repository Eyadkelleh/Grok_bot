import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cle } from '../i18n/stockage'

describe('language persistence', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.resetModules()
  })

  it('does not persist a detected language', async () => {
    await import('../i18n')
    expect(window.localStorage.getItem(cle('langue'))).toBeNull()
  })

  it('persists an explicit choice', async () => {
    const { langue } = await import('../i18n')
    langue.value = 'zh'
    expect(window.localStorage.getItem(cle('langue'))).toBe('zh')
  })

  it('restores a stored choice on load', async () => {
    window.localStorage.setItem(cle('langue'), 'fr')
    const { langue } = await import('../i18n')
    expect(langue.value).toBe('fr')
  })
})

describe('customise persistence', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.resetModules()
  })

  it('does not persist the defaults on load', async () => {
    await import('../customise')
    expect(window.localStorage.getItem(cle('forme'))).toBeNull()
    expect(window.localStorage.getItem(cle('couleur'))).toBeNull()
    expect(window.localStorage.getItem(cle('expression'))).toBeNull()
  })

  it('persists an explicit shape, colour, and expression', async () => {
    const { colour, expression, shape } = await import('../customise')
    shape.value = 'cloud'
    colour.value = 'violet'
    expression.value = 'curious'
    expect(window.localStorage.getItem(cle('forme'))).toBe('cloud')
    expect(window.localStorage.getItem(cle('couleur'))).toBe('violet')
    expect(window.localStorage.getItem(cle('expression'))).toBe('curious')
  })

  it('restores stored choices on load', async () => {
    window.localStorage.setItem(cle('forme'), 'capsule')
    window.localStorage.setItem(cle('couleur'), 'orange')
    window.localStorage.setItem(cle('expression'), 'proud')
    const { colour, expression, shape } = await import('../customise')
    expect(shape.value).toBe('capsule')
    expect(colour.value).toBe('orange')
    expect(expression.value).toBe('proud')
  })

  it('ignores stored values that are not in the catalogue', async () => {
    window.localStorage.setItem(cle('forme'), 'star')
    window.localStorage.setItem(cle('couleur'), 'gold')
    window.localStorage.setItem(cle('expression'), 'smirk')
    const { colour, expression, shape } = await import('../customise')
    expect(shape.value).toBe('circle')
    expect(colour.value).toBe('ink')
    expect(expression.value).toBe('neutral')
  })
})
