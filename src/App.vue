<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { colour, expression, shape } from './customise'
import { nomDeCycle, t, type Cle } from './i18n'
import {
  ecrireHash,
  FACE_STATES,
  lireHash,
  totalDuration,
  type AnimationState,
} from './engine'
import Avatar from './components/Avatar.vue'
import AnimationsPalette from './components/AnimationsPalette.vue'
import CustomisePanel from './components/CustomisePanel.vue'
import ExportBar from './components/ExportBar.vue'
import Settings from './components/Settings.vue'
import Timeline from './components/Timeline.vue'
import { exporte, exporteMontage } from './ui/capture'
import { ACTION_BY_ID, Abandon, type ActionId, type EtatExport } from './ui/export'
import {
  cycleForSource,
  makeVideoIntent,
  sourceFromCycle,
  sourceFromPose,
  type VideoSourceKind,
} from './ui/intent'

const initial = lireHash()
const animationState = ref<AnimationState>(initial.named ? initial.state : 'Idle')
const playing = ref(false)
const timelinePlaying = ref(false)
const studio = ref<HTMLElement | null>(null)
const timeline = ref<InstanceType<typeof Timeline> | null>(null)
const etatExport = ref<EtatExport>('pret')
const exportProgress = ref<number | null>(null)
let confirmation: ReturnType<typeof setTimeout> | undefined
let ecritParNous = ''
let exportAbort: AbortController | undefined

const CONFIRMATION_MS = 1800
const SECTIONS = ['studio', 'customise', 'settings', 'about'] as const
const STEPS = ['look', 'motion', 'video'] as const
const cycleActif = computed(() => timeline.value?.cycle ?? null)
const nomCycle = computed(() => (cycleActif.value ? nomDeCycle(cycleActif.value) : ''))
const dureeCycle = computed(() =>
  cycleActif.value ? totalDuration(cycleActif.value.blocks) : 0,
)
const blocsCycle = computed(() => cycleActif.value?.blocks.length ?? 0)
const skinLimited = computed(() => !FACE_STATES.has(animationState.value))
const poseLabel = computed(() => t(`animations.${animationState.value}` as Cle))

watch(
  [animationState, playing],
  ([id, on]) => {
    ecritParNous = ecrireHash(id, on)
  },
  { immediate: true },
)

function surHash() {
  if (location.hash === ecritParNous) {
    ecritParNous = ''
    return
  }
  const next = lireHash()
  if (!next.named) return
  playing.value = false
  timelinePlaying.value = false
  animationState.value = next.state
}

function aller(id: (typeof SECTIONS)[number]) {
  const cible = document.getElementById(id)
  if (!cible) return
  const calme = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  cible.scrollIntoView({ behavior: calme ? 'auto' : 'smooth', block: 'start' })
}

function svgCourant(): SVGSVGElement | null {
  const el = studio.value?.querySelector('svg[role="img"]')
  return el instanceof SVGSVGElement ? el : null
}

watch(timelinePlaying, (on) => {
  if (on) playing.value = true
})

function choisirMotion(id: AnimationState) {
  timelinePlaying.value = false
  animationState.value = id
  playing.value = true
}

async function surExport(payload: { action: ActionId; videoSource: VideoSourceKind }) {
  if (etatExport.value === 'occupe') return
  const action = ACTION_BY_ID.get(payload.action)
  if (!action) return

  clearTimeout(confirmation)
  exportAbort?.abort()
  exportAbort = new AbortController()
  exportProgress.value = action.mode === 'montage' ? 0 : null
  etatExport.value = 'occupe'
  try {
    if (action.mode === 'montage') {
      const cycle = cycleActif.value
      if (!cycle) throw new Error('no montage')
      const source =
        payload.videoSource === 'pose'
          ? sourceFromPose(animationState.value)
          : sourceFromCycle(cycle)
      const intent = makeVideoIntent(source, action.extension === 'mp4' ? 'mp4' : 'gif')
      const montage = cycleForSource(intent.source)
      await exporteMontage(
        intent.format,
        montage,
        {
          shape: shape.value,
          colour: colour.value,
          expression: expression.value,
        },
        intent.source.kind === 'pose' ? intent.source.state : nomDeCycle(cycle),
        (fait, total) => {
          exportProgress.value = total > 0 ? Math.min(100, Math.round((100 * fait) / total)) : 0
        },
        exportAbort.signal,
      )
    } else {
      const svg = svgCourant()
      if (!svg) throw new Error('no svg')
      await exporte(svg, payload.action, animationState.value)
    }
    etatExport.value = 'exporte'
  } catch (err) {
    etatExport.value = err instanceof Abandon ? 'pret' : 'erreur'
  } finally {
    exportProgress.value = null
    exportAbort = undefined
  }
  if (etatExport.value !== 'pret') {
    confirmation = setTimeout(() => (etatExport.value = 'pret'), CONFIRMATION_MS)
  }
}

function annulerExport() {
  exportAbort?.abort()
}

onMounted(() => window.addEventListener('hashchange', surHash))
onBeforeUnmount(() => {
  clearTimeout(confirmation)
  exportAbort?.abort()
  window.removeEventListener('hashchange', surHash)
})
</script>

<template>
  <div class="shell">
    <header class="topbar">
      <p class="brand">{{ t('app.name') }}</p>
      <nav class="nav" :aria-label="t('nav.label')">
        <a
          v-for="id in SECTIONS"
          :key="id"
          :href="`#${id}`"
          :data-nav="id"
          @click.prevent="aller(id)"
        >{{ t(`nav.${id}` as Cle) }}</a>
      </nav>
    </header>

    <main class="page">
      <section id="studio" ref="studio" class="create" data-create-flow>
        <p class="steps" data-create-steps :aria-label="t('flow.stepsLabel')">
          <span v-for="(step, i) in STEPS" :key="step" class="step">
            <span class="step-n">{{ i + 1 }}</span>
            {{ t(`flow.${step}` as Cle) }}
          </span>
        </p>
        <h1>{{ t('app.name') }}</h1>
        <p class="tagline">{{ t('app.tagline') }}</p>

        <div id="customise" class="stage" data-stage="look">
          <h2 class="stage-title">{{ t('flow.lookTitle') }}</h2>
          <CustomisePanel
            layout="compact"
            v-model:shape="shape"
            v-model:expression="expression"
            v-model:colour="colour"
          />
        </div>

        <div class="preview">
          <Avatar
            :state="animationState"
            :size="260"
            :shape="shape"
            :expression="expression"
            :colour="colour"
            :label="t('app.botAria')"
          />
          <p class="summary" data-create-summary>
            {{ t('flow.summary', { pose: poseLabel }) }}
          </p>
          <p v-if="skinLimited" class="hint" data-skin-limited>{{ t('panel.skinLimited') }}</p>
        </div>

        <div id="animations" class="stage" data-stage="motion">
          <h2 class="stage-title">{{ t('flow.motionTitle') }}</h2>
          <AnimationsPalette
            layout="strip"
            :model-value="animationState"
            v-model:colour="colour"
            @update:model-value="choisirMotion"
          />
        </div>

        <div class="stage" data-stage="video">
          <h2 class="stage-title">{{ t('flow.videoTitle') }}</h2>
          <ExportBar
            :etat="etatExport"
            :pose="animationState"
            :cycle-name="nomCycle"
            :cycle-duration="dureeCycle"
            :cycle-block-count="blocsCycle"
            :progress="exportProgress"
            @exporter="surExport"
            @annuler="annulerExport"
          />
        </div>
      </section>

      <details class="advanced" data-advanced-timeline>
        <summary>{{ t('flow.advancedTimeline') }}</summary>
        <Timeline ref="timeline" v-model:state="animationState" v-model:playing="timelinePlaying" />
      </details>

      <Settings />
    </main>
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
  gap: 2rem;
  padding: 1.25rem 1.25rem 3rem;
}

.create {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 1.75rem;
  width: 100%;
  max-width: 42rem;
  text-align: center;
}

.steps {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.55rem 1rem;
  margin: 0;
  color: var(--muted);
  font-size: 0.8125rem;
}

.step {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.step-n {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.35rem;
  height: 1.35rem;
  border-radius: 999px;
  background: var(--ink);
  color: var(--paper);
  font-size: 0.7rem;
  font-weight: 600;
}

h1 {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 600;
  letter-spacing: -0.03em;
}

.tagline {
  margin: -0.5rem 0 0;
  color: var(--muted);
  line-height: 1.5;
}

.stage {
  padding: 1rem 1.1rem 1.15rem;
  border: 1px solid var(--line);
  border-radius: 1rem;
  background: var(--paper);
  text-align: left;
}

.stage :deep([data-customise-panel]),
.stage :deep([data-animations-palette]),
.stage :deep([data-export-bar]) {
  max-width: none;
  border: 0;
  background: transparent;
  box-shadow: none;
  padding: 0;
}

.stage :deep([data-customise-panel] > h2) {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.stage-title {
  margin: 0 0 0.85rem;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 0.25rem 0 0.5rem;
}

.summary {
  margin: 0;
  color: var(--ink);
  font-size: 0.9375rem;
  font-weight: 500;
}

.hint {
  margin: 0;
  max-width: 28rem;
  color: var(--muted);
  font-size: 0.8125rem;
  line-height: 1.4;
}

.advanced {
  width: 100%;
  max-width: 64rem;
  border: 1px solid var(--line);
  border-radius: 1rem;
  background: var(--paper);
  padding: 0.75rem 1rem 1rem;
}

.advanced summary {
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--muted);
}

.advanced[open] summary {
  margin-bottom: 0.85rem;
  color: var(--ink);
}

.advanced :deep(.bar) {
  position: static;
  inset: auto;
  border: 0;
  border-radius: 0;
  box-shadow: none;
  padding: 0;
  width: 100%;
}
</style>
