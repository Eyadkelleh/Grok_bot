<script setup lang="ts">
import { computed, ref } from 'vue'
import { secondes, t, type Cle } from '../i18n'
import { type AnimationState } from '../engine'
import { videoPossible, type ActionId, type EtatExport } from '../ui/export'
import {
  durationForSource,
  type VideoSourceKind,
} from '../ui/intent'

const props = defineProps<{
  etat: EtatExport
  pose: AnimationState
  cycleName: string
  cycleDuration: number
  cycleBlockCount: number
  progress?: number | null
  bannerId?: string | null
}>()

const emit = defineEmits<{
  exporter: [
    payload: {
      action: ActionId | 'banner-png' | 'banner-mp4'
      videoSource: VideoSourceKind
    },
  ]
  annuler: []
}>()

const videoSource = ref<VideoSourceKind>('pose')
const occupe = computed(() => props.etat === 'occupe')
const mp4Ok = computed(() => videoPossible())
const progressPercent = computed(() =>
  Math.round(Math.min(100, Math.max(0, props.progress ?? 0))),
)

const poseLabel = computed(() => t(`animations.${props.pose}` as Cle))
const poseDuration = computed(() =>
  durationForSource({ kind: 'pose', state: props.pose }),
)

const primaryAction = computed<ActionId>(() => (mp4Ok.value ? 'mp4' : 'gif'))

const statut = computed(() => {
  if (props.etat === 'occupe') return t('export.progress', { percent: progressPercent.value })
  if (props.etat === 'exporte') return t('export.done')
  if (props.etat === 'erreur') return t('export.failed')
  return ''
})

function exporterPose(action: ActionId | 'banner-png' | 'banner-mp4') {
  emit('exporter', { action, videoSource: 'pose' })
}

function exporterCycle(action: ActionId) {
  emit('exporter', { action, videoSource: 'cycle' })
}

function exporterPrimary() {
  exporterPose(primaryAction.value)
}

const hasBanner = computed(() => Boolean(props.bannerId))
</script>

<template>
  <section class="export surface" data-export-bar aria-labelledby="export-title">
    <h2 id="export-title" class="sr-only">{{ t('export.title') }}</h2>

    <div class="group primary-group" data-export-group="montage">
      <p
        class="meta"
        data-export-meta
        data-export-duration
        :data-export-duration-secs="poseDuration"
      >
        {{
          t('export.metaPose', {
            name: poseLabel,
            duration: secondes(poseDuration),
          })
        }}
      </p>

      <button
        type="button"
        class="primary"
        data-export-primary
        :data-export="primaryAction"
        :disabled="occupe || (primaryAction === 'mp4' && !mp4Ok)"
        :title="primaryAction === 'mp4' && !mp4Ok ? t('export.mp4Unavailable') : undefined"
        @click="exporterPrimary"
      >
        {{ t('export.primaryVideo', { name: poseLabel, format: primaryAction.toUpperCase() }) }}
      </button>

      <div class="secondary-actions">
        <button
          v-if="primaryAction === 'mp4'"
          type="button"
          data-export="gif"
          :disabled="occupe"
          @click="exporterPose('gif')"
        >
          {{ t('export.gif') }}
        </button>
        <button
          v-else
          type="button"
          data-export="mp4"
          :disabled="occupe || !mp4Ok"
          :title="mp4Ok ? undefined : t('export.mp4Unavailable')"
          @click="exporterPose('mp4')"
        >
          {{ t('export.mp4') }}
        </button>
      </div>
    </div>

    <div v-if="hasBanner" class="group banner-group" data-export-group="banner">
      <h3>{{ t('export.banner') }}</h3>
      <div class="actions">
        <button
          type="button"
          data-export="banner-png"
          :disabled="occupe"
          @click="exporterPose('banner-png')"
        >
          {{ t('export.bannerPng') }}
        </button>
        <button
          type="button"
          data-export="banner-mp4"
          :disabled="occupe || !mp4Ok"
          :title="mp4Ok ? undefined : t('export.mp4Unavailable')"
          @click="exporterPose('banner-mp4')"
        >
          {{ t('export.bannerMp4') }}
        </button>
      </div>
    </div>

    <div class="group quiet" data-export-group="still">
      <h3>{{ t('export.stills') }}</h3>
      <div class="actions">
        <button type="button" data-export="png" :disabled="occupe" @click="exporterPose('png')">
          {{ t('export.png') }}
        </button>
        <button type="button" data-export="svg" :disabled="occupe" @click="exporterPose('svg')">
          {{ t('export.svg') }}
        </button>
      </div>
    </div>

    <details class="more" data-export-more>
      <summary>{{ t('export.moreOptions') }}</summary>
      <div class="sources" role="radiogroup" :aria-label="t('export.sourceLabel')">
        <button
          type="button"
          role="radio"
          data-export-pose
          data-export-source="pose"
          :aria-checked="videoSource === 'pose'"
          :class="{ selected: videoSource === 'pose' }"
          :disabled="occupe"
          @click="videoSource = 'pose'"
        >
          {{ t('export.sourcePose', { name: poseLabel }) }}
        </button>
        <button
          type="button"
          role="radio"
          data-export-cycle
          data-export-source="cycle"
          :aria-checked="videoSource === 'cycle'"
          :class="{ selected: videoSource === 'cycle' }"
          :disabled="occupe"
          @click="videoSource = 'cycle'"
        >
          {{ t('export.sourceCycle', { name: cycleName }) }}
        </button>
      </div>
      <p class="meta">
        {{
          t('export.metaCycle', {
            name: cycleName,
            duration: secondes(cycleDuration),
            count: cycleBlockCount,
          })
        }}
      </p>
      <div class="actions">
        <button type="button" data-export="gif" :disabled="occupe" @click="exporterCycle('gif')">
          {{ t('export.gifCycle') }}
        </button>
        <button
          type="button"
          data-export="mp4"
          :disabled="occupe || !mp4Ok"
          :title="mp4Ok ? undefined : t('export.mp4Unavailable')"
          @click="exporterCycle('mp4')"
        >
          {{ t('export.mp4Cycle') }}
        </button>
      </div>
    </details>

    <div v-if="statut" class="status-row">
      <p
        class="status"
        data-export-status
        :data-export-busy="etat === 'occupe' ? '' : undefined"
        :data-export-progress="etat === 'occupe' ? progressPercent : undefined"
        role="status"
      >
        {{ statut }}
      </p>
      <button
        v-if="occupe"
        type="button"
        class="cancel"
        data-export-cancel
        @click="emit('annuler')"
      >
        {{ t('export.cancel') }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.export {
  max-width: var(--rail);
  text-align: left;
}

.sr-only {
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

h3 {
  margin: 0.85rem 0 0;
  color: var(--muted);
  font-size: 0.875rem;
  font-weight: 500;
}

.primary-group {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.primary {
  width: 100%;
  padding: 0.95rem 1rem;
  border: 1px solid var(--ink);
  border-radius: 0.9rem;
  background: var(--ink);
  color: var(--paper);
  font: inherit;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
}

.primary:hover,
.primary:focus-visible {
  filter: brightness(1.08);
}

.primary:disabled {
  cursor: default;
  opacity: 0.6;
  filter: none;
}

.secondary-actions,
.actions,
.sources {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.secondary-actions button,
.actions button,
.sources button {
  flex: 1 1 7rem;
  padding: 0.55rem 0.75rem;
  border: 1px solid var(--line);
  border-radius: 0.75rem;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
}

.sources button.selected,
.secondary-actions button:hover,
.actions button:hover,
.sources button:hover,
.secondary-actions button:focus-visible,
.actions button:focus-visible,
.sources button:focus-visible {
  border-color: var(--ink);
}

.sources button.selected {
  background: var(--paper);
}

button:disabled {
  cursor: default;
  opacity: 0.6;
  filter: none;
}

.meta {
  margin: 0;
  color: var(--muted);
  font-size: 0.8125rem;
  line-height: 1.4;
}

.quiet h3 {
  margin-top: 0.85rem;
  font-size: 0.75rem;
}

.quiet .actions button {
  font-size: 0.8125rem;
  font-weight: 400;
  color: var(--muted);
}

.more {
  margin-top: 0.85rem;
}

.more .meta,
.more .actions,
.more .sources {
  margin-top: 0.5rem;
}

.more summary {
  cursor: pointer;
  color: var(--muted);
  font-size: 0.8125rem;
  font-weight: 500;
}

.more[open] summary {
  margin-bottom: 0.35rem;
  color: var(--ink);
}

.status-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
  margin: 0.5rem 0 0;
}

.status {
  margin: 0;
  color: var(--muted);
  font-size: 0.75rem;
}

.cancel {
  border: 0;
  background: transparent;
  color: var(--ink);
  font: inherit;
  font-size: 0.75rem;
  text-decoration: underline;
  cursor: pointer;
}
</style>
