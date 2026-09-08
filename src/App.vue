<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { colour, expression, shape } from './customise'
import { bannerCopy, bannerId } from './fond'
import { nomDeCycle, t, type Cle } from './i18n'
import { ecrireHash, lireHash, totalDuration, type AnimationState } from './engine'
import PhantomStudio from './components/PhantomStudio.vue'
import Settings from './components/Settings.vue'
import Timeline from './components/Timeline.vue'
import { exportBannerMontage, exportBannerStill } from './ui/bannerExport'
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
const timeline = ref<InstanceType<typeof Timeline> | null>(null)
const phantom = ref<InstanceType<typeof PhantomStudio> | null>(null)
const etatExport = ref<EtatExport>('pret')
const exportProgress = ref<number | null>(null)
let confirmation: ReturnType<typeof setTimeout> | undefined
let ecritParNous = ''
let exportAbort: AbortController | undefined

const CONFIRMATION_MS = 1800
const SECTIONS = ['studio', 'customise', 'settings', 'about'] as const
const cycleActif = computed(() => timeline.value?.cycle ?? null)
const nomCycle = computed(() => (cycleActif.value ? nomDeCycle(cycleActif.value) : ''))
const dureeCycle = computed(() =>
  cycleActif.value ? totalDuration(cycleActif.value.blocks) : 0,
)
const blocsCycle = computed(() => cycleActif.value?.blocks.length ?? 0)

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
  animationState.value = next.state
}

function aller(id: (typeof SECTIONS)[number]) {
  const cible = document.getElementById(id)
  if (!cible) return
  const calme = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  cible.scrollIntoView({ behavior: calme ? 'auto' : 'smooth', block: 'start' })
}

function svgCourant(): SVGSVGElement | null {
  return phantom.value?.svgCourant() ?? null
}

async function surExport(payload: {
  action: ActionId | 'banner-png' | 'banner-mp4'
  videoSource: VideoSourceKind
}) {
  if (etatExport.value === 'occupe') return

  clearTimeout(confirmation)
  exportAbort?.abort()
  exportAbort = new AbortController()
  const isBanner = payload.action === 'banner-png' || payload.action === 'banner-mp4'
  const action = isBanner ? null : ACTION_BY_ID.get(payload.action)
  if (!isBanner && !action) return

  exportProgress.value =
    isBanner || action?.mode === 'montage' ? 0 : null
  etatExport.value = 'occupe'
  try {
    if (payload.action === 'banner-png' || payload.action === 'banner-mp4') {
      const id = bannerId.value
      if (!id) throw new Error('no banner')
      const cycle = cycleActif.value
      if (!cycle) throw new Error('no montage')
      const source =
        payload.videoSource === 'pose'
          ? sourceFromPose(animationState.value)
          : sourceFromCycle(cycle)
      const montage = cycleForSource(source)
      const reglages = {
        shape: shape.value,
        colour: colour.value,
        expression: expression.value,
      }
      const nom =
        source.kind === 'pose' ? source.state : nomDeCycle(cycle)
      if (payload.action === 'banner-png') {
        await exportBannerStill(id, bannerCopy.value, reglages, montage.blocks, nom)
      } else {
        await exportBannerMontage(
          id,
          bannerCopy.value,
          reglages,
          montage,
          nom,
          (fait, total) => {
            exportProgress.value =
              total > 0 ? Math.min(100, Math.round((100 * fait) / total)) : 0
          },
          exportAbort.signal,
        )
      }
    } else if (action!.mode === 'montage') {
      const cycle = cycleActif.value
      if (!cycle) throw new Error('no montage')
      const source =
        payload.videoSource === 'pose'
          ? sourceFromPose(animationState.value)
          : sourceFromCycle(cycle)
      const intent = makeVideoIntent(source, action!.extension === 'mp4' ? 'mp4' : 'gif')
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
      await exporte(svg, payload.action as ActionId, animationState.value)
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
      <PhantomStudio
        ref="phantom"
        v-model:shape="shape"
        v-model:expression="expression"
        v-model:colour="colour"
        v-model:state="animationState"
        v-model:banner-id="bannerId"
        v-model:banner-copy="bannerCopy"
        :label="t('app.botAria')"
        :etat-export="etatExport"
        :cycle-name="nomCycle"
        :cycle-duration="dureeCycle"
        :cycle-block-count="blocsCycle"
        :progress="exportProgress"
        @exporter="surExport"
        @annuler="annulerExport"
        @stop-playing="playing = false"
      />
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
  padding: 1rem 1.5rem 14rem;
}
</style>
