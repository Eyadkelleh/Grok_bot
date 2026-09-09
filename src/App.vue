<script setup lang="ts">
import { computed, onBeforeUnmount, provide } from 'vue'
import { nomDeCycle, t, type Cle } from './i18n'
import { poseCycle, totalDuration } from './engine'
import OutputDock from './components/OutputDock.vue'
import Settings from './components/Settings.vue'
import Stage from './components/Stage.vue'
import Timeline from './components/Timeline.vue'
import { createStudioSession, STUDIO } from './studio'

const studio = createStudioSession()
provide(STUDIO, studio)
onBeforeUnmount(studio.dispose)

const SECTIONS = ['settings', 'about'] as const

const focus = studio.focus
const desk = computed(() => studio.deskOf(focus.value))
const video = studio.video

/** The export bar names the cycle on video and the standing pose on image. */
const cycle = computed(() => video.activeCycle.value)
const poseDuration = computed(() =>
  totalDuration(poseCycle(desk.value.config.value.pose).blocks),
)

function aller(id: (typeof SECTIONS)[number]) {
  const cible = document.getElementById(id)
  if (!cible) return
  const calme = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  cible.scrollIntoView({ behavior: calme ? 'auto' : 'smooth', block: 'start' })
}
</script>

<template>
  <div class="shell" :data-focus="focus">
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
  gap: 0.5rem 0.85rem;
}

.nav a {
  color: var(--muted);
  font-size: 0.875rem;
  text-decoration: none;
}

.nav a:hover,
.nav a:focus-visible {
  color: var(--ink);
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
