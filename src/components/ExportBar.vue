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
}>()

const emit = defineEmits<{
  exporter: [payload: { action: ActionId; videoSource: VideoSourceKind }]
  annuler: []
}>()

const videoSource = ref<VideoSourceKind>('pose')
const occupe = computed(() => props.etat === 'occupe')
const mp4Ok = computed(() => videoPossible())
const progressPercent = computed(() =>
  Math.round(Math.min(100, Math.max(0, props.progress ?? 0))),
)

const poseLabel = computed(() => t(`animations.${props.pose}` as Cle))

const videoMeta = computed(() => {
  if (videoSource.value === 'pose') {
    return {
      name: poseLabel.value,
      duration: durationForSource({
        kind: 'pose',
        state: props.pose,
      }),
    }
  }
  return { name: props.cycleName, duration: props.cycleDuration }
})

const statut = computed(() => {
  if (props.etat === 'occupe') return t('export.progress', { percent: progressPercent.value })
  if (props.etat === 'exporte') return t('export.done')
  if (props.etat === 'erreur') return t('export.failed')
  return ''
})

function labelVideo(format: 'gif' | 'mp4') {
  const cle = videoSource.value === 'pose' ? `export.${format}Pose` : `export.${format}Cycle`
  return t(cle as Cle, { name: videoMeta.value.name })
}

function exporter(action: ActionId) {
  emit('exporter', { action, videoSource: videoSource.value })
}
</script>

<template>
  <section class="export surface" data-export-bar aria-labelledby="export-title">
    <h2 id="export-title">{{ t('export.title') }}</h2>

    <div class="group" data-export-group="still">
      <h3>{{ t('export.stills') }}</h3>
      <div class="actions">
        <button
          type="button"
          data-export="png"
          :disabled="occupe"
          @click="exporter('png')"
        >
          {{ t('export.png') }}
        </button>
        <button
          type="button"
          data-export="svg"
          :disabled="occupe"
          @click="exporter('svg')"
        >
          {{ t('export.svg') }}
        </button>
      </div>
    </div>

    <div class="group" data-export-group="montage">
      <h3>{{ t('export.video') }}</h3>
      <div
        class="sources"
        role="radiogroup"
        :aria-label="t('export.sourceLabel')"
      >
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
      <p
        class="meta"
        data-export-meta
        data-export-duration
        :data-export-duration-secs="videoMeta.duration"
      >
        {{
          videoSource === 'pose'
            ? t('export.metaPose', {
                name: poseLabel,
                duration: secondes(videoMeta.duration),
              })
            : t('export.metaCycle', {
                name: cycleName,
                duration: secondes(cycleDuration),
                count: cycleBlockCount,
              })
        }}
      </p>
      <div class="actions">
        <button
          type="button"
          data-export="gif"
          :disabled="occupe"
          @click="exporter('gif')"
        >
          {{ labelVideo('gif') }}
        </button>
        <button
          type="button"
          data-export="mp4"
          :disabled="occupe || !mp4Ok"
          :title="mp4Ok ? undefined : t('export.mp4Unavailable')"
          @click="exporter('mp4')"
        >
          {{ labelVideo('mp4') }}
        </button>
      </div>
    </div>

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

h2,
h3 {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
}

h3 {
  margin-top: 0.85rem;
  color: var(--muted);
  font-weight: 500;
}

.actions,
.sources {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.5rem;
}

.sources button,
.actions button {
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
.actions button:hover,
.actions button:focus-visible,
.sources button:hover,
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
  margin: 0.45rem 0 0;
  color: var(--muted);
  font-size: 0.75rem;
  line-height: 1.4;
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
