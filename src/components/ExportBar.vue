<script setup lang="ts">
import { computed } from 'vue'
import { secondes, t, type Cle } from '../i18n'
import type { AnimationState } from '../engine'
import type { DeliveryOffer, DeliveryState, DeskKind } from '../studio'

type Offer = DeliveryOffer<DeskKind>

const props = defineProps<{
  kind: DeskKind
  formats: readonly Offer[]
  state: DeliveryState
  progress?: number | null
  pose: AnimationState
  poseDuration: number
  cycleName?: string
  cycleDuration?: number
  cycleBlockCount?: number
}>()

const emit = defineEmits<{
  deliver: [format: string]
  annuler: []
}>()

const LABELS: Record<string, Cle> = {
  png: 'export.png',
  svg: 'export.svg',
  gif: 'export.gif',
  mp4: 'export.mp4',
  'banner-png': 'export.bannerPng',
  'banner-mp4': 'export.bannerMp4',
}

const occupe = computed(() => props.state === 'busy')
const poseLabel = computed(() => t(`animations.${props.pose}` as Cle))
/** Null for a still, which has no frames to count. */
const progressPercent = computed(() =>
  props.progress == null ? null : Math.round(Math.min(100, Math.max(0, props.progress))),
)

const plain = computed(() => props.formats.filter((f) => !f.format.startsWith('banner-')))
const primary = computed(() => plain.value.find((f) => f.enabled) ?? plain.value[0] ?? null)
const secondary = computed(() => plain.value.filter((f) => f !== primary.value))
const banner = computed(() => props.formats.filter((f) => f.format.startsWith('banner-')))

const durationSecs = computed(() =>
  props.kind === 'video' ? (props.cycleDuration ?? 0) : props.poseDuration,
)

const meta = computed(() =>
  props.kind === 'video'
    ? t('export.metaCycle', {
        name: props.cycleName ?? '',
        duration: secondes(props.cycleDuration ?? 0),
        count: props.cycleBlockCount ?? 0,
      })
    : t('export.metaPose', {
        name: poseLabel.value,
        duration: secondes(props.poseDuration),
      }),
)

const primaryLabel = computed(() =>
  primary.value
    ? t('export.primary', {
        name: props.kind === 'video' ? (props.cycleName ?? '') : poseLabel.value,
        format: primary.value.format.toUpperCase(),
      })
    : '',
)

function unavailable(offer: Offer) {
  return offer.enabled ? undefined : t('export.mp4Unavailable')
}

const statut = computed(() => {
  if (props.state === 'busy') {
    return progressPercent.value === null
      ? t('export.busy')
      : t('export.progress', { percent: progressPercent.value })
  }
  if (props.state === 'done') return t('export.done')
  if (props.state === 'error') return t('export.failed')
  return ''
})
</script>

<template>
  <section class="export surface" data-export-bar aria-labelledby="export-title">
    <h2 id="export-title" class="sr-only">{{ t('export.title') }}</h2>

    <div class="group primary-group" :data-export-group="kind === 'video' ? 'montage' : 'still'">
      <p
        class="meta"
        data-export-meta
        data-export-duration
        :data-export-cycle="kind === 'video' ? (cycleName ?? '') : undefined"
        :data-export-duration-secs="durationSecs"
      >
        {{ meta }}
      </p>

      <button
        v-if="primary"
        type="button"
        class="primary"
        data-export-primary
        :data-export="primary.format"
        :disabled="occupe || !primary.enabled"
        :title="unavailable(primary)"
        @click="emit('deliver', primary.format)"
      >
        {{ primaryLabel }}
      </button>

      <div v-if="secondary.length" class="secondary-actions">
        <button
          v-for="offer in secondary"
          :key="offer.format"
          type="button"
          :data-export="offer.format"
          :disabled="occupe || !offer.enabled"
          :title="unavailable(offer)"
          @click="emit('deliver', offer.format)"
        >
          {{ t(LABELS[offer.format]!) }}
        </button>
      </div>
    </div>

    <div v-if="banner.length" class="group banner-group" data-export-group="banner">
      <h3>{{ t('export.banner') }}</h3>
      <div class="actions">
        <button
          v-for="offer in banner"
          :key="offer.format"
          type="button"
          :data-export="offer.format"
          :disabled="occupe || !offer.enabled"
          :title="unavailable(offer)"
          @click="emit('deliver', offer.format)"
        >
          {{ t(LABELS[offer.format]!) }}
        </button>
      </div>
    </div>

    <div v-if="statut" class="status-row">
      <p
        class="status"
        data-export-status
        :data-export-busy="occupe ? '' : undefined"
        :data-export-progress="occupe ? (progressPercent ?? undefined) : undefined"
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
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.secondary-actions button,
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

.secondary-actions button:hover,
.actions button:hover,
.secondary-actions button:focus-visible,
.actions button:focus-visible {
  border-color: var(--ink);
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
