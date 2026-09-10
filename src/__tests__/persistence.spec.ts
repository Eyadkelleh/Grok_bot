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
