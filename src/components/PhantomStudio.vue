<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  sampleAvatar,
  viewBoxAttr,
  type AnimationState,
  type ColorId,
  type ExpressionId,
  type ShapeId,
} from '../engine'
import { t } from '../i18n'
import { useStageGeometry } from '../ui/useStageGeometry'
import AnimationsPalette from './AnimationsPalette.vue'
import Avatar from './Avatar.vue'
import CustomisePanel from './CustomisePanel.vue'
import ExportBar from './ExportBar.vue'
import type { ActionId, EtatExport } from '../ui/export'

export type FieldId = 'shape' | 'expression' | 'colour' | 'state' | null

const shape = defineModel<ShapeId>('shape', { required: true })
const expression = defineModel<ExpressionId>('expression', { required: true })
const colour = defineModel<ColorId>('colour', { required: true })
const animationState = defineModel<AnimationState>('state', { required: true })

const props = defineProps<{
  label: string
  etatExport: EtatExport
}>()

const emit = defineEmits<{
  exporter: [id: ActionId]
  'stop-playing': []
}>()

const stage = ref<HTMLElement | null>(null)
const { size } = useStageGeometry(stage)
const field = ref<FieldId>(null)

const hero = computed(() =>
  sampleAvatar({
    shape: shape.value,
    expression: expression.value,
    colour: colour.value,
    state: animationState.value,
  }),
)

const cavity = computed(() =>
  sampleAvatar({
    shape: shape.value,
    expression: expression.value,
    colour: colour.value,
    state: 'Idle',
  }),
)

const showCavity = computed(() => hero.value.geometryKind === 'symbol')

watch(animationState, () => emit('stop-playing'))

function setField(next: FieldId) {
  field.value = field.value === next ? null : next
}

function svgCourant(): SVGSVGElement | null {
  const el = stage.value?.querySelector('svg[role="img"]')
  return el instanceof SVGSVGElement ? el : null
}

defineExpose({ svgCourant })
</script>

<template>
  <div class="phantom" data-phantom-studio>
    <section id="studio" ref="stage" class="stage">
      <div class="hero-wrap">
        <svg
          v-if="showCavity"
          class="cavity"
          :width="size"
          :height="size"
          :viewBox="viewBoxAttr()"
          aria-hidden="true"
        >
          <path :d="cavity.path" fill="none" stroke="currentColor" stroke-width="1.2" />
        </svg>
        <Avatar
          :state="animationState"
          :size="size"
          :shape="shape"
          :expression="expression"
          :colour="colour"
          :label="label"
        />
        <p v-if="showCavity" class="lock" role="status">{{ t('studio.shapeLocked') }}</p>
      </div>

      <div class="verbs" role="toolbar" :aria-label="t('studio.modes')">
        <button
          type="button"
          data-mode="shape"
          :aria-pressed="field === 'shape'"
          :class="{ on: field === 'shape' }"
          @click="setField('shape')"
        >
          {{ t('studio.shape') }}
        </button>
        <button
          type="button"
          data-mode="expression"
          :aria-pressed="field === 'expression'"
          :class="{ on: field === 'expression' }"
          @click="setField('expression')"
        >
          {{ t('studio.face') }}
        </button>
        <button
          type="button"
          data-mode="colour"
          :aria-pressed="field === 'colour'"
          :class="{ on: field === 'colour' }"
          @click="setField('colour')"
        >
          {{ t('studio.aura') }}
        </button>
        <button
          type="button"
          data-mode="state"
          :aria-pressed="field === 'state'"
          :class="{ on: field === 'state' }"
          @click="setField('state')"
        >
          {{ t('studio.motion') }}
        </button>
      </div>

      <div
        class="field customise"
        :data-field="'shape'"
        :class="{ open: field === 'shape' || field === 'expression' || field === 'colour' }"
        :data-open-band="field === 'shape' || field === 'expression' || field === 'colour' ? field : null"
      >
        <CustomisePanel
          id="customise"
          v-model:shape="shape"
          v-model:expression="expression"
          v-model:colour="colour"
        />
      </div>

      <div class="field motion" :class="{ open: field === 'state' }">
        <AnimationsPalette
          id="animations"
          v-model="animationState"
        />
      </div>

      <h1>{{ t('app.name') }}</h1>
      <p class="tagline">{{ t('app.tagline') }}</p>
      <ExportBar :etat="etatExport" @exporter="emit('exporter', $event)" />
    </section>
  </div>
</template>

<style scoped>
.phantom {
  width: 100%;
  max-width: 56rem;
}

.stage {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  min-height: calc(100svh - var(--chrome, 11rem));
  padding: 0.5rem 0.75rem 1rem;
  text-align: center;
}

.hero-wrap {
  position: relative;
  display: grid;
  place-items: center;
  flex: 1 1 auto;
  width: min(100%, 36rem);
  min-height: 16rem;
}

.hero-wrap :deep(.avatar) {
  position: relative;
  z-index: 2;
}

.cavity {
  position: absolute;
  inset: 50%;
  translate: -50% -50%;
  z-index: 1;
  color: color-mix(in srgb, var(--muted) 55%, transparent);
  pointer-events: none;
  opacity: 0.55;
}

.lock {
  position: absolute;
  bottom: 0.25rem;
  z-index: 3;
  margin: 0;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--paper) 88%, transparent);
  color: var(--muted);
  font-size: 0.75rem;
  line-height: 1.3;
}

.verbs {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.4rem;
  z-index: 4;
}

.verbs button {
  padding: 0.4rem 0.85rem;
  border: 1px solid transparent;
  border-radius: 999px;
  background: transparent;
  color: var(--muted);
  font: inherit;
  font-size: 0.8125rem;
  cursor: pointer;
}

.verbs button.on,
.verbs button:hover,
.verbs button:focus-visible {
  border-color: var(--line);
  color: var(--ink);
  background: color-mix(in srgb, var(--paper) 80%, transparent);
}

.field {
  position: absolute;
  z-index: 3;
  width: min(100%, 18rem);
  max-height: min(52vh, 28rem);
  overflow: auto;
  opacity: 0;
  pointer-events: none;
  transform: translateY(0.4rem) scale(0.98);
  transition:
    opacity 160ms ease,
    transform 160ms ease;
}

.field.open {
  opacity: 1;
  pointer-events: auto;
  transform: none;
}

.field.customise {
  left: 0;
  top: 4.5rem;
}

.field.motion {
  right: 0;
  top: 4.5rem;
}

.field :deep(.rail) {
  max-width: none;
  border-color: color-mix(in srgb, var(--line) 70%, transparent);
  background: color-mix(in srgb, var(--paper) 82%, transparent);
  backdrop-filter: blur(10px);
  box-shadow: 0 12px 40px rgb(0 0 0 / 0.06);
}

.field.customise[data-open-band='shape'] :deep(#customise-expression),
.field.customise[data-open-band='shape'] :deep(#customise-expression + .tiles),
.field.customise[data-open-band='shape'] :deep(#customise-colour),
.field.customise[data-open-band='shape'] :deep(#customise-colour + .swatches) {
  display: none;
}

.field.customise[data-open-band='expression'] :deep(#customise-shape),
.field.customise[data-open-band='expression'] :deep(#customise-shape + .tiles),
.field.customise[data-open-band='expression'] :deep(#customise-colour),
.field.customise[data-open-band='expression'] :deep(#customise-colour + .swatches) {
  display: none;
}

.field.customise[data-open-band='colour'] :deep(#customise-shape),
.field.customise[data-open-band='colour'] :deep(#customise-shape + .tiles),
.field.customise[data-open-band='colour'] :deep(#customise-expression),
.field.customise[data-open-band='colour'] :deep(#customise-expression + .tiles) {
  display: none;
}

.field.customise[data-open-band='shape'] :deep(#customise-title),
.field.customise[data-open-band='expression'] :deep(#customise-title),
.field.customise[data-open-band='colour'] :deep(#customise-title) {
  display: none;
}

.field.motion :deep(h2) {
  display: none;
}

@media (max-width: 40rem) {
  .field.customise,
  .field.motion {
    left: 50%;
    right: auto;
    top: auto;
    bottom: 7.5rem;
    width: min(100% - 1rem, 22rem);
    translate: -50% 0;
  }
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

@media (prefers-reduced-motion: reduce) {
  .field {
    transition: none;
  }
}
</style>
