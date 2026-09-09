import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_PAPER } from '../../engine'
import { BLANC } from '../../ui/export'
import { applyChrome, createTheme } from '../theme'
import type { ThemeChoice } from '../types'

type Listener = (event: MediaQueryListEvent) => void

function stubPrefersDark(dark: boolean) {
  const listeners: Listener[] = []
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('prefers-color-scheme: dark') ? dark : false,
    media: query,
    addEventListener: (_: string, fn: Listener) => listeners.push(fn),
    removeEventListener: (_: string, fn: Listener) => {
      const i = listeners.indexOf(fn)
      if (i >= 0) listeners.splice(i, 1)
    },
  }))
  return {
    flipTo(next: boolean) {
      for (const fn of [...listeners]) fn({ matches: next } as MediaQueryListEvent)
    },
    get listenerCount() {
      return listeners.length
    },
  }
}

describe('theme', () => {
  beforeEach(() => {
    delete document.documentElement.dataset.theme
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('paints the chrome from an explicit choice and persists it', () => {
    const saved: ThemeChoice[] = []
    stubPrefersDark(false)
    const theme = createTheme('light', (c) => saved.push(c))

    expect(theme.resolved.value).toBe('light')
    expect(document.documentElement.dataset.theme).toBe('light')

    theme.choose('dark')

    expect(theme.resolved.value).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(saved).toEqual(['dark'])
    theme.stop()
  })

  it('derives the resolved theme from the system when the choice is system', () => {
    const media = stubPrefersDark(true)
    const theme = createTheme('system', () => {})

    expect(theme.choice.value).toBe('system')
    expect(theme.resolved.value).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')

    media.flipTo(false)

    expect(theme.choice.value).toBe('system')
    expect(theme.resolved.value).toBe('light')
    expect(document.documentElement.dataset.theme).toBe('light')
    theme.stop()
  })

  it('stops following the system once an explicit choice is made', () => {
    const media = stubPrefersDark(false)
    const theme = createTheme('system', () => {})

    theme.choose('dark')
    media.flipTo(true)
    media.flipTo(false)

    expect(theme.resolved.value).toBe('dark')
    theme.stop()
    expect(media.listenerCount).toBe(0)
  })

  it('leaves the avatar paper and the delivery matte theme-independent', () => {
    applyChrome('dark')
    expect(DEFAULT_PAPER).toBe('#f5f5f4')
    expect(BLANC).toBe('#ffffff')
  })
})
