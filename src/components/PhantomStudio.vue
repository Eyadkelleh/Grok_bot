<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  DEFAULT_MORPH_MS,
  isAnimationState,
  isExpressionId,
  isShapeId,
  sampleAvatar,
  viewBoxAttr,
  type AnimationState,
  type Block,
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
import type { VideoSourceKind } from '../ui/intent'

type FieldId = 'shape' | 'expression' | 'colour' | 'state'

const shape = defineModel<ShapeId>('shape', { required: true })
const expression = defineModel<ExpressionId>('expression', { required: true })
const colour = defineModel<ColorId>('colour', { required: true })
const animationState = defineModel<AnimationState>('state', { required: true })

const props = defineProps<{
  label: string
  etatExport: EtatExport
  cycleName: string
  cycleDuration: number
  cycleBlockCount: number
  progress?: number | null
  playing?: boolean
  playhead?: number | null
  blocks?: Block[]
}>()

const emit = defineEmits<{
  exporter: [payload: { action: ActionId; videoSource: VideoSourceKind }]
  annuler: []
  'stop-playing': []
}>()

const stage = ref<HTMLElement | null>(null)
const { size } = useStageGeometry(stage)
const field = ref<FieldId | null>(null)
const previewShape = ref<ShapeId | null>(null)
const previewExpression = ref<ExpressionId | null>(null)
const previewState = ref<AnimationState | null>(null)

const shownShape = computed(() => previewShape.value ?? shape.value)
const shownExpression = computed(() => previewExpression.value ?? expression.value)
const shownState = computed(() => previewState.value ?? animationState.value)
const morphMs = computed(() =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
    ? 0
    : DEFAULT_MORPH_MS,
)

const hero = computed(() =>
  sampleAvatar({
    shape: shownShape.value,
    expression: shownExpression.value,
    colour: colour.value,
    state: shownState.value,
  }),
)

const cavity = computed(() =>
  sampleAvatar({
    shape: shownShape.value,
    expression: shownExpression.value,
    colour: colour.value,
    state: 'Idle',
  }),
)

const showCavity = computed(() => hero.value.geometryKind === 'symbol')
const skinLimited = computed(
  () => hero.value.geometryKind === 'wearable' && hero.value.eyes.length === 0,
)
const appearanceOpen = computed(
  () => field.value === 'shape' || field.value === 'expression' || field.value === 'colour',
)

function clearPreviews() {
  previewShape.value = null
  previewExpression.value = null
  previewState.value = null
}

function setField(next: FieldId) {
  clearPreviews()
  field.value = field.value === next ? null : next
}

function onChooserPointer(event: PointerEvent) {
  const node = event.target as HTMLElement | null
  if (field.value === 'shape') {
    const id = node?.closest('[data-shape]')?.getAttribute('data-shape')
    previewShape.value = id && isShapeId(id) ? id : null
    return
  }
  if (field.value === 'expression') {
    const id = node?.closest('[data-expression]')?.getAttribute('data-expression')
    previewExpression.value = id && isExpressionId(id) ? id : null
    return
  }
  if (field.value === 'state') {
    if (props.playing) return
    const id = node?.closest('[data-state]')?.getAttribute('data-state')
    previewState.value = id && isAnimationState(id) ? id : null
  }
}

function commitMotion() {
  emit('stop-playing')
}

function commitFace() {
  emit('stop-playing')
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
          focusable="false"
          :data-cavity-shape="shownShape"
          data-shape-applied="false"
        >
          <path :d="cavity.path" fill="none" stroke="currentColor" stroke-width="1.2" />
        </svg>
        <Avatar
          :state="shownState"
          :size="size"
          :shape="shownShape"
          :expression="shownExpression"
          :colour="colour"
          :label="label"
          :duration-ms="morphMs"
          :playhead="props.playhead ?? null"
          :blocks="props.blocks ?? []"
        />
        <p v-if="showCavity" class="lock" role="status">{{ t('studio.shapeLocked') }}</p>
        <p v-else-if="skinLimited" class="lock" data-skin-limited role="status">
          {{ t('panel.skinLimited') }}
        </p>
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
        :class="{
          open: appearanceOpen,
          orbital: field === 'shape' || field === 'expression',
          skins: field === 'shape',
          faces: field === 'expression',
        }"
        :data-open-band="appearanceOpen ? field : null"
        @pointerover="onChooserPointer"
        @pointerleave="clearPreviews"
      >
        <CustomisePanel
          id="customise"
          v-model:shape="shape"
          v-model:expression="expression"
          v-model:colour="colour"
          @update:expression="commitFace"
        />
      </div>

      <div
        class="field motion"
        :class="{ open: field === 'state', orbital: field === 'state', orbits: field === 'state' }"
        @pointerover="onChooserPointer"
        @pointerleave="clearPreviews"
      >
        <AnimationsPalette id="animations" v-model="animationState" @update:modelValue="commitMotion" />
      </div>

      <h1>{{ t('app.name') }}</h1>
      <p class="tagline">{{ t('app.tagline') }}</p>
      <ExportBar
        :etat="props.etatExport"
        :pose="animationState"
        :cycle-name="props.cycleName"
        :cycle-duration="props.cycleDuration"
        :cycle-block-count="props.cycleBlockCount"
        :progress="props.progress"
        @exporter="emit('exporter', $event)"
        @annuler="emit('annuler')"
      />
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
.field.customise[data-open-band='shape'] :deep(#customise-colour + .swatches),
.field.customise[data-open-band='expression'] :deep(#customise-shape),
.field.customise[data-open-band='expression'] :deep(#customise-shape + .tiles),
.field.customise[data-open-band='expression'] :deep(#customise-colour),
.field.customise[data-open-band='expression'] :deep(#customise-colour + .swatches),
.field.customise[data-open-band='colour'] :deep(#customise-shape),
.field.customise[data-open-band='colour'] :deep(#customise-shape + .tiles),
.field.customise[data-open-band='colour'] :deep(#customise-expression),
.field.customise[data-open-band='colour'] :deep(#customise-expression + .tiles),
.field.customise[data-open-band='shape'] :deep(#customise-title),
.field.customise[data-open-band='expression'] :deep(#customise-title),
.field.customise[data-open-band='colour'] :deep(#customise-title),
.field.customise.skins :deep(#customise-shape),
.field.customise.faces :deep(#customise-expression) {
  display: none;
}

.field.motion :deep(h2) {
  display: none;
}

.field.orbital {
  inset: 0;
  width: 100%;
  max-width: none;
  max-height: none;
  overflow: visible;
  background: none;
  pointer-events: none;
}

.field.orbital.open {
  pointer-events: none;
}

.field.orbital :deep([data-customise-panel]),
.field.orbital :deep([data-animations-palette]) {
  max-width: none;
  border: none;
  background: none;
  box-shadow: none;
  backdrop-filter: none;
}

.field.orbital :deep(.tiles),
.field.orbital :deep(.swatches) {
  display: contents;
}

.field.orbital :deep([data-shape]),
.field.orbital :deep([data-expression]),
.field.orbital :deep([data-state]) {
  position: absolute;
  z-index: 5;
  opacity: 0.4;
  pointer-events: auto;
  border-color: transparent;
  background: color-mix(in srgb, var(--paper) 55%, transparent);
  transition:
    opacity 160ms ease,
    transform 160ms ease,
    border-color 160ms ease;
}

.field.customise.skins :deep([data-shape]) {
  width: 3.25rem;
  height: 3.25rem;
}

.field.customise.faces :deep([data-expression]),
.field.motion.orbits :deep([data-state]) {
  left: 50%;
  top: 36%;
  width: 2.65rem;
  height: 2.65rem;
  margin: -1.325rem;
  transform: rotate(var(--a, 0deg)) translate(min(42vw, 15.25rem)) rotate(calc(var(--a, 0deg) * -1))
    scale(0.96);
}

.field.motion.orbits :deep(button span) {
  display: none;
}

.field.motion.orbits :deep(svg) {
  width: 100%;
  height: auto;
}

.field.customise.skins :deep([data-shape].selected),
.field.customise.skins :deep([data-shape]:hover),
.field.customise.skins :deep([data-shape]:focus-visible),
.field.customise.faces :deep([data-expression].selected),
.field.customise.faces :deep([data-expression]:hover),
.field.customise.faces :deep([data-expression]:focus-visible),
.field.motion.orbits :deep([data-state].selected),
.field.motion.orbits :deep([data-state]:hover),
.field.motion.orbits :deep([data-state]:focus-visible) {
  z-index: 6;
  opacity: 0.9;
  border-color: var(--line);
}

.field.customise.skins :deep([data-shape].selected),
.field.customise.skins :deep([data-shape]:hover),
.field.customise.skins :deep([data-shape]:focus-visible) {
  transform: scale(1.06);
}

.field.customise.faces :deep([data-expression].selected),
.field.customise.faces :deep([data-expression]:hover),
.field.customise.faces :deep([data-expression]:focus-visible),
.field.motion.orbits :deep([data-state].selected),
.field.motion.orbits :deep([data-state]:hover),
.field.motion.orbits :deep([data-state]:focus-visible) {
  transform: rotate(var(--a, 0deg)) translate(min(42vw, 15.25rem)) rotate(calc(var(--a, 0deg) * -1))
    scale(1.08);
}

.field.customise.skins :deep([data-shape='circle']) {
  left: 6%;
  top: 24%;
}
.field.customise.skins :deep([data-shape='pebble']) {
  left: 4%;
  top: 46%;
}
.field.customise.skins :deep([data-shape='squircle']) {
  left: 10%;
  top: 68%;
}
.field.customise.skins :deep([data-shape='capsule']) {
  left: 28%;
  top: 10%;
}
.field.customise.skins :deep([data-shape='triangle']) {
  right: 28%;
  top: 10%;
  left: auto;
}
.field.customise.skins :deep([data-shape='hexagon']) {
  right: 6%;
  top: 26%;
  left: auto;
}
.field.customise.skins :deep([data-shape='cloud']) {
  right: 4%;
  top: 48%;
  left: auto;
}
.field.customise.skins :deep([data-shape='droplet']) {
  right: 12%;
  top: 70%;
  left: auto;
}

.field.customise.faces :deep([data-expression='neutral']) {
  --a: -90deg;
}
.field.customise.faces :deep([data-expression='attentive']) {
  --a: -67.5deg;
}
.field.customise.faces :deep([data-expression='surprised']) {
  --a: -45deg;
}
.field.customise.faces :deep([data-expression='excited']) {
  --a: -22.5deg;
}
.field.customise.faces :deep([data-expression='happy']) {
  --a: 0deg;
}
.field.customise.faces :deep([data-expression='laughing']) {
  --a: 22.5deg;
}
.field.customise.faces :deep([data-expression='angry']) {
  --a: 45deg;
}
.field.customise.faces :deep([data-expression='sad']) {
  --a: 67.5deg;
}
.field.customise.faces :deep([data-expression='scared']) {
  --a: 90deg;
}
.field.customise.faces :deep([data-expression='wary']) {
  --a: 112.5deg;
}
.field.customise.faces :deep([data-expression='confused']) {
  --a: 135deg;
}
.field.customise.faces :deep([data-expression='curious']) {
  --a: 157.5deg;
}
.field.customise.faces :deep([data-expression='proud']) {
  --a: 180deg;
}
.field.customise.faces :deep([data-expression='shy']) {
  --a: -157.5deg;
}
.field.customise.faces :deep([data-expression='bored']) {
  --a: -135deg;
}
.field.customise.faces :deep([data-expression='sleepy']) {
  --a: -112.5deg;
}

.field.motion.orbits :deep([data-state='Idle']) {
  --a: -90deg;
}
.field.motion.orbits :deep([data-state='Thinking']) {
  --a: -64.3deg;
}
.field.motion.orbits :deep([data-state='Wink']) {
  --a: -38.6deg;
}
.field.motion.orbits :deep([data-state='WideEyes']) {
  --a: -12.9deg;
}
.field.motion.orbits :deep([data-state='Alert']) {
  --a: 12.8deg;
}
.field.motion.orbits :deep([data-state='Notification']) {
  --a: 38.6deg;
}
.field.motion.orbits :deep([data-state='Exclamation']) {
  --a: 64.3deg;
}
.field.motion.orbits :deep([data-state='Sleep']) {
  --a: 90deg;
}
.field.motion.orbits :deep([data-state='Egg']) {
  --a: 115.7deg;
}
.field.motion.orbits :deep([data-state='Hexagon']) {
  --a: 141.4deg;
}
.field.motion.orbits :deep([data-state='Play']) {
  --a: 167.1deg;
}
.field.motion.orbits :deep([data-state='Orbit']) {
  --a: 192.8deg;
}
.field.motion.orbits :deep([data-state='Burst']) {
  --a: 218.6deg;
}
.field.motion.orbits :deep([data-state='Comet']) {
  --a: 244.3deg;
}

@media (max-width: 40rem) {
  .field.customise:not(.orbital),
  .field.motion:not(.orbital) {
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
  .field,
  .field.orbital :deep([data-shape]),
  .field.orbital :deep([data-expression]),
  .field.orbital :deep([data-state]) {
    transition: none;
  }
}
</style>
