/**
 * Composition root: two independent desks, one focus, one persistence writer.
 *
 * Components are handed the session and never import a store, which is what
 * makes a cross-desk write unreachable rather than merely discouraged.
 */

import { computed, inject, ref, watch, type ComputedRef, type InjectionKey } from 'vue'
import { createDesk, type DeskFor, type ImageDesk, type VideoDesk } from './desk'
import { loadDoc, saveDoc, type StudioDoc } from './doc'
import { readLocation, writeLocation } from './location'
import { createTheme, type ThemeController } from './theme'
import type { BannerCopy, ConfigFor, DeskKind } from './types'

export interface StudioSession {
  readonly focus: ComputedRef<DeskKind>
  readonly image: ImageDesk
  readonly video: VideoDesk
  readonly theme: ThemeController
  /** The plate is per desk because it is composition; the words are one
   *  event's content, so nobody retypes them twice. */
  readonly bannerCopy: ComputedRef<BannerCopy>
  focusDesk(kind: DeskKind): void
  setBannerCopy(patch: Partial<BannerCopy>): void
  deskOf<K extends DeskKind>(kind: K): DeskFor<K>
  dispose(): void
}

export const STUDIO: InjectionKey<StudioSession> = Symbol('studio')

export function createStudioSession(): StudioSession {
  const doc = ref<StudioDoc>(loadDoc())
  let ownWrite = ''

  function patch(next: Partial<StudioDoc>) {
    doc.value = { ...doc.value, ...next }
    saveDoc(doc.value)
  }

  const theme = createTheme(doc.value.theme, (choice) => patch({ theme: choice }))

  const bannerCopy = computed(() => doc.value.shared.bannerCopy)

  function deskPort<K extends DeskKind>(kind: K) {
    return {
      config: computed(() => doc.value[kind] as ConfigFor<K>),
      bannerCopy,
      write: (next: ConfigFor<K>) => patch({ [kind]: next } as Partial<StudioDoc>),
    }
  }

  const image = createDesk('image', deskPort('image'))
  const video = createDesk('video', deskPort('video'))

  function deskOf<K extends DeskKind>(kind: K): DeskFor<K> {
    return (kind === 'image' ? image : video) as DeskFor<K>
  }

  const focus = computed(() => doc.value.focus)
  const focused = computed(() => deskOf(focus.value))

  const opening = readLocation()
  if (opening.focus) patch({ focus: opening.focus })
  if (opening.pose) {
    focused.value.commit({ field: 'pose', value: opening.pose })
  }

  let shown: DeskKind | null = null

  watch(
    () => [focus.value, focused.value.config.value.pose, video.transport.playing.value] as const,
    ([kind, pose, playing]) => {
      const mode = shown !== null && shown !== kind ? 'push' : 'replace'
      shown = kind
      ownWrite = writeLocation({ focus: kind, pose, playing: kind === 'video' && playing }, mode)
    },
    { immediate: true, flush: 'sync' },
  )

  function onNavigation() {
    const here = `${location.pathname}${location.search}${location.hash}`
    if (here === ownWrite) return
    const next = readLocation()
    if (next.focus && next.focus !== focus.value) patch({ focus: next.focus })
    if (next.pose) {
      video.transport.pause()
      deskOf(focus.value).commit({ field: 'pose', value: next.pose })
    }
  }

  window.addEventListener('hashchange', onNavigation)
  window.addEventListener('popstate', onNavigation)

  return {
    focus,
    image,
    video,
    theme,
    bannerCopy,
    focusDesk(kind) {
      if (kind === focus.value) return
      if (kind !== 'video') video.transport.pause()
      patch({ focus: kind })
    },
    setBannerCopy(next) {
      patch({ shared: { bannerCopy: { ...bannerCopy.value, ...next } } })
    },
    deskOf,
    dispose() {
      window.removeEventListener('hashchange', onNavigation)
      window.removeEventListener('popstate', onNavigation)
      theme.stop()
      image.dispose()
      video.dispose()
    },
  }
}

export function useStudio(): StudioSession {
  const session = inject(STUDIO)
  if (!session) throw new Error('studio session not provided')
  return session
}
