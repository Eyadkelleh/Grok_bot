<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, provide, ref } from 'vue'
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

const shell = ref<HTMLElement | null>(null)
const navCourante = ref<SectionId | null>(null)
const visibles = new Set<SectionId>()
let observateur: IntersectionObserver | null = null

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
  const suivante = [...SECTIONS].reverse().find((id) => visibles.has(id))
  if (suivante) navCourante.value = suivante
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

function aller(id: SectionId) {
  navCourante.value = id
  const cible = shell.value?.querySelector(`#${id}`)
  if (!(cible instanceof HTMLElement)) return
  const calme =
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
  cible.scrollIntoView?.({ behavior: calme ? 'auto' : 'smooth', block: 'start' })
}

onMounted(lierNav)
onBeforeUnmount(() => {
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
          @click.prevent="aller(id)"
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
      <Settings />
    </main>

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

@media (max-width: 40rem) {
  .page {
    padding-bottom: 7rem;
  }

  .page.docked {
    padding-bottom: 20rem;
  }
}
</style>
