<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, provide, ref, watch } from 'vue'
import { nomDeCycle, t, type Cle } from './i18n'
import { poseCycle, totalDuration } from './engine'
import OutputDock from './components/OutputDock.vue'
import RollupPanel from './components/RollupPanel.vue'
import Settings from './components/Settings.vue'
import Stage from './components/Stage.vue'
import Timeline from './components/Timeline.vue'
import { createStudioSession, STUDIO } from './studio'
import { resolveChromeAccent } from './ui/chromeAccent'

const studio = createStudioSession()
provide(STUDIO, studio)

const SECTIONS = ['rollup', 'settings', 'about'] as const
type SectionId = (typeof SECTIONS)[number]
type FeuilleId = 'settings' | 'about'

const FOCUSABLES =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

const shell = ref<HTMLElement | null>(null)
const feuilleEl = ref<HTMLElement | null>(null)
const closeEl = ref<HTMLButtonElement | null>(null)
const feuille = ref<FeuilleId | null>(null)
const navCourante = ref<SectionId | null>(null)
const visibles = new Set<SectionId>()
let observateur: IntersectionObserver | null = null
let retourFocus: HTMLElement | null = null

const focus = studio.focus
const desk = computed(() => studio.deskOf(focus.value))
const video = studio.video
const chromeAccent = computed(() =>
  resolveChromeAccent(desk.value.config.value.look.colour),
)

/** The export bar names the cycle on video and the standing pose on image. */
const cycle = computed(() => video.activeCycle.value)
const poseDuration = computed(() =>
  totalDuration(poseCycle(desk.value.config.value.pose).blocks),
)

function sectionDe(cible: Element | null): SectionId | null {
  const id = cible?.id
  return id === 'rollup' || id === 'settings' || id === 'about' ? id : null
}

function rangerNav() {
  observateur?.disconnect()
  observateur = null
  visibles.clear()
}

function choisirNav() {
  if (feuille.value) {
    const dans = (['about', 'settings'] as const).find((id) => visibles.has(id))
    navCourante.value = dans ?? feuille.value
    return
  }
  // Settings/About live in the sheet; page scroll only owns Rollup.
  navCourante.value = visibles.has('rollup') ? 'rollup' : null
}

function lierNav() {
  rangerNav()
  if (typeof IntersectionObserver !== 'function') return
  observateur = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const id = sectionDe(entry.target)
        if (!id) continue
        if (entry.isIntersecting) visibles.add(id)
        else visibles.delete(id)
      }
      choisirNav()
    },
    { rootMargin: '-12% 0px -70% 0px', threshold: [0, 0.25, 0.6] },
  )
  for (const id of SECTIONS) {
    const cible = shell.value?.querySelector(`#${id}`)
    if (cible) observateur.observe(cible)
  }
}

function calme(): boolean {
  return (
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

function ouvrirFeuille(id: FeuilleId, from: HTMLElement | null) {
  retourFocus = from
  feuille.value = id
  choisirNav()
  void nextTick(() => {
    const panel = feuilleEl.value
    if (!panel) return
    if (id === 'about') {
      const about = panel.querySelector('#about')
      if (about instanceof HTMLElement) {
        about.scrollIntoView?.({ behavior: calme() ? 'auto' : 'smooth', block: 'start' })
      }
    } else {
      panel.scrollTop = 0
    }
    closeEl.value?.focus()
  })
}

function fermerFeuille() {
  if (!feuille.value) return
  feuille.value = null
  choisirNav()
  const cible = retourFocus
  retourFocus = null
  void nextTick(() => {
    if (cible?.isConnected) cible.focus()
  })
}

function aller(id: SectionId, event: MouseEvent) {
  const from = event.currentTarget instanceof HTMLElement ? event.currentTarget : null
  if (id === 'settings' || id === 'about') {
    ouvrirFeuille(id, from)
    return
  }
  if (feuille.value) fermerFeuille()
  navCourante.value = id
  const cible = shell.value?.querySelector(`#${id}`)
  if (!(cible instanceof HTMLElement)) return
  cible.scrollIntoView?.({ behavior: calme() ? 'auto' : 'smooth', block: 'start' })
}

function surClavierFeuille(event: KeyboardEvent) {
  if (!feuille.value) return
  if (event.key === 'Escape') {
    event.preventDefault()
    fermerFeuille()
    return
  }
  if (event.key !== 'Tab') return
  const panel = feuilleEl.value
  if (!panel) return
  const liste = [...panel.querySelectorAll<HTMLElement>(FOCUSABLES)].filter(
    (el) => !el.hasAttribute('disabled') && el.tabIndex !== -1,
  )
  if (liste.length === 0) {
    event.preventDefault()
    return
  }
  const premier = liste[0]!
  const dernier = liste[liste.length - 1]!
  const actif = document.activeElement
  if (event.shiftKey && actif === premier) {
    event.preventDefault()
    dernier.focus()
  } else if (!event.shiftKey && actif === dernier) {
    event.preventDefault()
    premier.focus()
  }
}

watch(feuille, (ouverte) => {
  if (typeof document === 'undefined') return
  document.body.style.overflow = ouverte ? 'hidden' : ''
})

onMounted(lierNav)
onBeforeUnmount(() => {
  document.body.style.overflow = ''
  rangerNav()
  studio.dispose()
})
</script>

<template>
  <div ref="shell" class="shell" :data-focus="focus" :style="chromeAccent.cssVars">
    <header class="topbar">
      <p class="brand">{{ t('app.name') }}</p>
      <OutputDock
        :focus="focus"
        :image-colour="studio.image.config.value.look.colour"
        :video-colour="studio.video.config.value.look.colour"
        :video-duration="video.transport.total.value"
        @focus="studio.focusDesk($event)"
      />
      <nav class="nav" :aria-label="t('nav.label')">
        <a
          v-for="id in SECTIONS"
          :key="id"
          :href="`#${id}`"
          :data-nav="id"
          :aria-current="navCourante === id ? 'location' : undefined"
          @click.prevent="aller(id, $event)"
          >{{ t(`nav.${id}` as Cle) }}</a
        >
      </nav>
    </header>

    <main class="page" :class="{ docked: focus === 'video' }">
      <!-- Keyed so the stage remounts and re-attaches its SVG to the focused desk. -->
      <Stage
        :key="focus"
        :desk="desk"
        :banner-copy="studio.bannerCopy.value"
        :label="t('app.botAria')"
        :cycle-name="nomDeCycle(cycle)"
        :cycle-duration="totalDuration(cycle.blocks)"
        :cycle-block-count="cycle.blocks.length"
        :pose-duration="poseDuration"
      />
      <RollupPanel
        :desk="desk"
        :banner-copy="studio.bannerCopy.value"
        @banner-copy="studio.setBannerCopy($event)"
      />
    </main>

    <div
      class="sheet-layer"
      :class="{ open: feuille }"
      :data-settings-sheet="feuille ?? undefined"
      :aria-hidden="feuille ? undefined : 'true'"
    >
      <button
        type="button"
        class="sheet-backdrop"
        tabindex="-1"
        :aria-label="t('settings.closeAria')"
        @click="fermerFeuille"
      />
      <div
        ref="feuilleEl"
        class="sheet"
        data-settings-panel
        :role="feuille ? 'dialog' : undefined"
        :aria-modal="feuille ? 'true' : undefined"
        :aria-labelledby="feuille ? 'settings-title' : undefined"
        :inert="feuille ? undefined : true"
        @keydown="surClavierFeuille"
      >
        <button
          ref="closeEl"
          type="button"
          class="sheet-close"
          data-sheet-close
          :aria-label="t('settings.closeAria')"
          @click="fermerFeuille"
        >
          {{ t('settings.close') }}
        </button>
        <Settings />
      </div>
    </div>

    <Timeline v-if="focus === 'video'" :desk="video" />
  </div>
</template>

<style scoped>
.shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.topbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem 1.25rem;
  padding: 1rem 1.5rem;
}

.brand {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 600;
  letter-spacing: -0.03em;
}

.nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.05rem;
  margin-left: 0.15rem;
  padding-left: 0.95rem;
  border-left: 1px solid var(--line);
}

.nav a {
  position: relative;
  color: var(--muted);
  font-size: 0.875rem;
  text-decoration: none;
  padding: 0.1rem 0.05rem 0.5rem;
}

.nav a::before {
  content: '';
  position: absolute;
  left: 0.05rem;
  right: 0.05rem;
  bottom: 0.18rem;
  height: 1px;
  background: var(--line);
}

.nav a::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: 0.05rem;
  width: 0;
  height: 4px;
  border-radius: 99px;
  background: transparent;
  transform: translateX(-50%);
  pointer-events: none;
}

.nav a:hover:not([aria-current='location']) {
  color: var(--ink);
}

.nav a:hover:not([aria-current='location'])::after {
  width: 5px;
  background: var(--muted);
}

.nav a[aria-current='location'] {
  color: var(--ink);
}

.nav a[aria-current='location']::after {
  width: 1.75rem;
  height: 4px;
  background:
    radial-gradient(circle at 50% 50%, var(--accent-display) 2px, transparent 2.4px),
    linear-gradient(var(--accent-display), var(--accent-display)) center / 1.75rem 2px no-repeat;
  box-shadow: 0 0 8px var(--accent-glow);
}

.nav a:focus-visible {
  color: var(--ink);
  outline: 2px solid var(--ink);
  outline-offset: 4px;
}

@media (prefers-reduced-motion: reduce) {
  .nav a[aria-current='location']::after {
    box-shadow: none;
  }
}

.page {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2.5rem;
  padding: 1rem 1.5rem 4rem;
}

.page.docked {
  padding-bottom: 18rem;
}

.sheet-layer {
  position: fixed;
  inset: 0;
  z-index: 50;
  pointer-events: none;
}

.sheet-layer.open {
  pointer-events: auto;
}

.sheet-backdrop {
  position: absolute;
  inset: 0;
  border: 0;
  padding: 0;
  margin: 0;
  cursor: pointer;
  opacity: 0;
  background:
    radial-gradient(ellipse 80% 60% at 85% 15%, var(--accent-glow), transparent 60%),
    color-mix(in srgb, var(--accent-display) 28%, var(--canvas));
  transition: opacity 0.22s ease;
}

.sheet-layer.open .sheet-backdrop {
  opacity: 1;
}

.sheet {
  position: absolute;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  background: var(--paper);
  color: var(--ink);
  box-shadow:
    -12px 0 40px rgb(var(--wash) / 0.08),
    inset 3px 0 0 var(--accent-display);
  overflow: auto;
  overscroll-behavior: contain;
  transition: transform 0.24s ease;
}

.sheet-close {
  align-self: flex-end;
  margin: 0.85rem 0.85rem 0;
  padding: 0.4rem 0.75rem;
  border: 1px solid var(--line);
  border-radius: 0.65rem;
  background: var(--accent-soft);
  color: var(--ink);
  font: inherit;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
}

.sheet-close:hover,
.sheet-close:focus-visible {
  border-color: color-mix(in srgb, var(--accent-display) 55%, var(--line));
}

.sheet-close:focus-visible {
  outline: 2px solid var(--accent-display);
  outline-offset: 2px;
}

@media (min-width: 40.01rem) {
  .sheet {
    top: 0;
    right: 0;
    bottom: 0;
    width: min(24rem, 100%);
    padding: 0 1.25rem 1.75rem;
    transform: translateX(100%);
  }

  .sheet-layer.open .sheet {
    transform: translateX(0);
  }
}

@media (max-width: 40rem) {
  .sheet {
    left: 0;
    right: 0;
    bottom: 0;
    max-height: min(94svh, 100%);
    padding: 0 1rem calc(1.25rem + env(safe-area-inset-bottom));
    border-radius: 1.1rem 1.1rem 0 0;
    box-shadow:
      0 -12px 40px rgb(var(--wash) / 0.1),
      inset 0 3px 0 var(--accent-display);
    transform: translateY(100%);
  }

  .sheet-layer.open .sheet {
    transform: translateY(0);
  }
}

.sheet-layer:not(.open) .sheet,
.sheet-layer:not(.open) .sheet-backdrop {
  visibility: hidden;
}

@media (prefers-reduced-motion: reduce) {
  .sheet,
  .sheet-backdrop {
    transition: none;
  }
}

@media (max-width: 40rem) {
  .page {
    padding-bottom: 7rem;
  }

  .page.docked {
    padding-bottom: 20rem;
  }
}
</style>
