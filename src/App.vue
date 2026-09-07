<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { colour, expression, shape } from './customise'
import { nomDeCycle, t } from './i18n'
import type { AnimationState } from './engine'
import Avatar from './components/Avatar.vue'
import AnimationsPalette from './components/AnimationsPalette.vue'
import CustomisePanel from './components/CustomisePanel.vue'
import ExportBar from './components/ExportBar.vue'
import Settings from './components/Settings.vue'
import Timeline from './components/Timeline.vue'
import { exporte, exporteMontage } from './ui/capture'
import { ACTION_BY_ID, type ActionId, type EtatExport } from './ui/export'

const animationState = ref<AnimationState>('Idle')
const playing = ref(false)
const studio = ref<HTMLElement | null>(null)
const timeline = ref<InstanceType<typeof Timeline> | null>(null)
const etatExport = ref<EtatExport>('pret')
let confirmation: ReturnType<typeof setTimeout> | undefined

const CONFIRMATION_MS = 1800

function svgCourant(): SVGSVGElement | null {
  const el = studio.value?.querySelector('svg[role="img"]')
  return el instanceof SVGSVGElement ? el : null
}

function cycleCourant() {
  return timeline.value?.cycle ?? null
}

async function surExport(id: ActionId) {
  if (etatExport.value === 'occupe') return
  const action = ACTION_BY_ID.get(id)
  if (!action) return

  clearTimeout(confirmation)
  etatExport.value = 'occupe'
  try {
    if (action.mode === 'montage') {
      const cycle = cycleCourant()
      if (!cycle) throw new Error('no montage')
      await exporteMontage(action.extension === 'mp4' ? 'mp4' : 'gif', cycle, {
        shape: shape.value,
        colour: colour.value,
        expression: expression.value,
      }, nomDeCycle(cycle))
    } else {
      const svg = svgCourant()
      if (!svg) throw new Error('no svg')
      await exporte(svg, id, animationState.value)
    }
    etatExport.value = 'exporte'
  } catch {
    etatExport.value = 'erreur'
  }
  confirmation = setTimeout(() => (etatExport.value = 'pret'), CONFIRMATION_MS)
}

onBeforeUnmount(() => clearTimeout(confirmation))
</script>

<template>
  <div class="shell">
    <header class="topbar">
      <p class="brand">{{ t('app.name') }}</p>
      <nav class="nav" :aria-label="t('nav.label')">
        <a href="#studio" data-nav="studio">{{ t('nav.studio') }}</a>
        <a href="#customise" data-nav="customise">{{ t('nav.customise') }}</a>
        <a href="#settings" data-nav="settings">{{ t('nav.settings') }}</a>
        <a href="#about" data-nav="about">{{ t('nav.about') }}</a>
      </nav>
    </header>

    <main class="page">
      <div class="workspace">
        <CustomisePanel
          id="customise"
          v-model:shape="shape"
          v-model:expression="expression"
          v-model:colour="colour"
        />
        <section id="studio" ref="studio" class="studio">
          <Avatar
            :state="animationState"
            :size="220"
            :shape="shape"
            :expression="expression"
            :colour="colour"
            :label="t('app.botAria')"
          />
          <h1>{{ t('app.name') }}</h1>
          <p class="tagline">{{ t('app.tagline') }}</p>
          <ExportBar :etat="etatExport" @exporter="surExport" />
        </section>
        <AnimationsPalette v-model="animationState" @update:modelValue="playing = false" />
      </div>
      <Settings />
    </main>
    <Timeline ref="timeline" v-model:state="animationState" v-model:playing="playing" />
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
  gap: 0.75rem;
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
  padding: 2rem 1.5rem 14rem;
}

.workspace {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: center;
  gap: 2rem 2.5rem;
  width: 100%;
  max-width: 64rem;
}

.studio {
  display: flex;
  flex: 1 1 16rem;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
  text-align: center;
}

h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: -0.03em;
}

.tagline {
  margin: 0;
  max-width: 28rem;
  color: var(--muted);
  line-height: 1.5;
}
</style>
