/**
 * Theme choice and the one paint layer it owns: document chrome.
 *
 * The stage well and the delivery matte are deliberately not here. The well is
 * pinned to the avatar's canonical paper by the `--stage` token, and the matte
 * stays `BLANC` in `ui/export.ts`, so there is nothing on the delivery path to
 * pass a theme into.
 */

import { computed, ref, type ComputedRef } from 'vue'
import type { Theme, ThemeChoice } from './types'

export interface ThemeController {
  readonly choice: ComputedRef<ThemeChoice>
  readonly resolved: ComputedRef<Theme>
  choose(next: ThemeChoice): void
  stop(): void
}

export const THEME_CHOICES: readonly ThemeChoice[] = ['light', 'dark', 'system']

function darkQuery(): MediaQueryList | null {
  if (typeof matchMedia !== 'function') return null
  return matchMedia('(prefers-color-scheme: dark)')
}

/** Mirrors the `documentElement.lang` precedent in `i18n/index.ts`. */
export function applyChrome(theme: Theme) {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.theme = theme
}

export function createTheme(
  initial: ThemeChoice,
  persist: (choice: ThemeChoice) => void,
): ThemeController {
  const query = darkQuery()
  const chosen = ref<ThemeChoice>(initial)
  const systemDark = ref(query?.matches ?? false)

  const onSystem = (event: MediaQueryListEvent) => {
    systemDark.value = event.matches
    applyChrome(resolved.value)
  }
  query?.addEventListener('change', onSystem)

  const resolved = computed<Theme>(() =>
    chosen.value === 'system' ? (systemDark.value ? 'dark' : 'light') : chosen.value,
  )

  applyChrome(resolved.value)

  return {
    choice: computed(() => chosen.value),
    resolved,
    choose(next) {
      chosen.value = next
      applyChrome(resolved.value)
      persist(next)
    },
    stop() {
      query?.removeEventListener('change', onSystem)
    },
  }
}
