<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, type WritableComputedRef } from 'vue'
import {
  COLORS,
  DEFAULT_MORPH_MS,
  isAnimationState,
  isColorId,
  isExpressionId,
  isShapeId,
  sampleAvatar,
  viewBoxAttr,
  type AnimationState,
  type ColorId,
  type ExpressionId,
  type ShapeId,
} from '../engine'
import { t } from '../i18n'
import {
  VERBS,
  type BannerCopy,
  type FormatFor,
  type ImageDesk,
  type LookFacet,
  type VerbId,
  type VideoDesk,
} from '../studio'
import { useStageGeometry } from '../ui/useStageGeometry'
import { CADRE_BANNER_PNG, mesureScene, sceneBanniere } from '../ui/scene'
import AnimationsPalette from './AnimationsPalette.vue'
import Avatar from './Avatar.vue'
import BannerBackdrop from './BannerBackdrop.vue'
import CustomisePanel from './CustomisePanel.vue'
import ExportBar from './ExportBar.vue'

const props = defineProps<{
  desk: ImageDesk | VideoDesk
  bannerCopy: BannerCopy
  label: string
  cycleName?: string
  cycleDuration?: number
  cycleBlockCount?: number
  poseDuration: number
}>()

const stage = ref<HTMLElement | null>(null)
const { size } = useStageGeometry(stage)

const frame = computed(() => props.desk.frame.value)
const band = computed(() => props.desk.band.value)
const status = computed(() => props.desk.delivery.value)
const hoverId = ref<VerbId | null>(null)

const landmarks = (['shape', 'expression', 'colour', 'pose'] as const).map((id) => VERBS[id])

const spectrum = `linear-gradient(90deg, ${COLORS.map(
  (colour) => `color-mix(in srgb, ${colour.hex} 58%, var(--paper))`,
).join(', ')})`

const openIndex = computed(() => (band.value ? VERBS[band.value].railIndex : null))
const hoverIndex = computed(() => {
  if (!hoverId.value || hoverId.value === band.value) return null
  return VERBS[hoverId.value].railIndex
})
const shelfTitle = computed(() => (band.value ? t(VERBS[band.value].labelKey) : ''))

/** Pickers show the committed value; the hero shows the preview. */
function facet<T>(read: () => T, field: LookFacet['field']): WritableComputedRef<T> {
  return computed({
    get: read,
    set: (value) => props.desk.commit({ field, value } as LookFacet),
  })
}

const shape = facet<ShapeId>(() => props.desk.config.value.look.shape, 'shape')
const expression = facet<ExpressionId>(() => props.desk.config.value.look.expression, 'expression')
const colour = facet<ColorId>(() => props.desk.config.value.look.colour, 'colour')
const pose = facet<AnimationState>(() => props.desk.config.value.pose, 'pose')

const morphMs = computed(() =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
    ? 0
    : DEFAULT_MORPH_MS,
)
const hasBanner = computed(() => frame.value.banner !== null)

const logoSlot = computed(() => {
  if (!frame.value.banner) return null
  const scene = sceneBanniere(frame.value.banner, CADRE_BANNER_PNG, props.bannerCopy)
  return mesureScene(scene).logo
})

const avatarSize = computed(() => {
  if (!hasBanner.value || !logoSlot.value) return size.value
  const slot = logoSlot.value
  const bannerW = Math.min(size.value * 0.55, 224)
  const scale = bannerW / CADRE_BANNER_PNG.width
  return Math.max(72, Math.round(Math.min(slot.w, slot.h) * scale * 0.84))
})

const hero = computed(() =>
  sampleAvatar({
    shape: frame.value.shape,
    expression: frame.value.expression,
    colour: frame.value.colour,
    state: frame.value.pose,
  }),
)

const cavity = computed(() =>
  sampleAvatar({
    shape: frame.value.shape,
    expression: frame.value.expression,
    colour: frame.value.colour,
    state: 'Idle',
  }),
)

const showCavity = computed(() => hero.value.geometryKind === 'symbol')
const skinLimited = computed(
  () => hero.value.geometryKind === 'wearable' && hero.value.eyes.length === 0,
)
const appearanceOpen = computed(
  () => band.value === 'shape' || band.value === 'expression' || band.value === 'colour',
)

function onVerbKeydown(event: KeyboardEvent) {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
  const buttons = [
    ...(event.currentTarget as HTMLElement).querySelectorAll<HTMLButtonElement>('[data-mode]'),
  ]
  const index = buttons.findIndex((button) => button === document.activeElement)
  if (index < 0) return
  event.preventDefault()
  const step = event.key === 'ArrowRight' ? 1 : -1
  buttons[(index + step + buttons.length) % buttons.length]?.focus()
}

function onChooserPointer(event: PointerEvent) {
  const node = event.target as HTMLElement | null
  const open = band.value
  if (open === 'shape') {
    const id = node?.closest('[data-shape]')?.getAttribute('data-shape')
    props.desk.preview(id && isShapeId(id) ? { field: 'shape', value: id } : null)
    return
  }
  if (open === 'expression') {
    const id = node?.closest('[data-expression]')?.getAttribute('data-expression')
    props.desk.preview(id && isExpressionId(id) ? { field: 'expression', value: id } : null)
    return
  }
  if (open === 'colour') {
    const id = node?.closest('[data-colour]')?.getAttribute('data-colour')
    props.desk.preview(id && isColorId(id) ? { field: 'colour', value: id } : null)
    return
  }
  if (open === 'pose') {
    const id = node?.closest('[data-state]')?.getAttribute('data-state')
    props.desk.preview(id && isAnimationState(id) ? { field: 'pose', value: id } : null)
  }
}

function clearPreviews() {
  props.desk.preview(null)
}

/**
 * The offers came from this desk, so the format is legal by construction; a
 * union of two `deliver` signatures has no way to say so.
 */
function deliver(format: string) {
  const desk = props.desk
  if (desk.kind === 'image') void desk.deliver(format as FormatFor<'image'>)
  else void desk.deliver(format as FormatFor<'video'>)
}

function svgCourant(): SVGSVGElement | null {
  const el = stage.value?.querySelector('svg[role="img"]')
  return el instanceof SVGSVGElement ? el : null
}

let detach: (() => void) | null = null
onMounted(() => {
  detach = props.desk.attachStage(svgCourant)
})
onBeforeUnmount(() => {
  detach?.()
  detach = null
})
</script>

<template>
  <div class="phantom" data-phantom-studio :data-has-banner="hasBanner ? '' : undefined">
    <section id="studio" ref="stage" class="stage" :data-desk="desk.kind">
      <div class="hero-wrap" :class="{ bannered: hasBanner }">
        <BannerBackdrop v-if="frame.banner" :banner-id="frame.banner" :copy="bannerCopy" />
        <svg
          v-if="showCavity && !hasBanner"
          class="cavity"
          :width="size"
          :height="size"
          :viewBox="viewBoxAttr()"
          aria-hidden="true"
          focusable="false"
          :data-cavity-shape="frame.shape"
          data-shape-applied="false"
        >
          <path :d="cavity.path" fill="none" stroke="currentColor" stroke-width="1.2" />
        </svg>
        <Avatar
          class="hero-avatar"
          :state="frame.pose"
          :size="avatarSize"
          :shape="frame.shape"
          :expression="frame.expression"
          :colour="frame.colour"
          :label="label"
          :duration-ms="morphMs"
          :playhead="frame.playhead"
          :blocks="[...frame.blocks]"
        />
        <p v-if="showCavity && !hasBanner" class="lock" role="status">{{ t('studio.shapeLocked') }}</p>
        <p v-else-if="skinLimited" class="lock" data-skin-limited role="status">
          {{ t('panel.skinLimited') }}
        </p>
      </div>

      <div
        class="verbs"
        role="toolbar"
        :aria-label="t('studio.modes')"
        :style="{
          '--spectrum': spectrum,
          '--open-index': openIndex ?? 0,
          '--hover-index': hoverIndex ?? 0,
        }"
        :data-bead="openIndex == null ? undefined : openIndex"
        :data-tick="hoverIndex == null ? undefined : hoverIndex"
        @keydown="onVerbKeydown"
      >
        <div class="landmarks">
          <button
            v-for="verb in landmarks"
            :key="verb.id"
            type="button"
            :data-mode="verb.dataMode"
            :aria-pressed="band === verb.id"
            :class="{ open: band === verb.id }"
            @click="desk.openBand(verb.id)"
            @pointerenter="hoverId = verb.id"
            @pointerleave="hoverId = null"
          >
            <span class="glyph" aria-hidden="true">
              <svg viewBox="0 0 16 16">
                <circle
                  v-if="verb.id === 'shape'"
                  cx="8"
                  cy="8"
                  r="5.25"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.4"
                />
                <g v-else-if="verb.id === 'expression'" fill="currentColor">
                  <circle cx="5.4" cy="7.2" r="1.35" />
                  <circle cx="10.6" cy="7.2" r="1.35" />
                </g>
                <circle v-else-if="verb.id === 'colour'" cx="8" cy="8" r="5" fill="currentColor" />
                <g v-else fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round">
                  <path d="M3.2 11.4c2.4-1.1 4.1-3.6 4.6-6.6" />
                  <circle cx="11.2" cy="4.2" r="1.7" fill="currentColor" stroke="none" />
                </g>
              </svg>
            </span>
            <span class="label">{{ t(verb.labelKey) }}</span>
          </button>
        </div>
        <div class="spectrum" aria-hidden="true">
          <span class="track" />
          <span class="glint" />
          <span class="glow" />
          <span class="bead" />
          <span class="tick" />
        </div>
      </div>

      <div class="shelf">
        <p v-if="band" class="shelf-head">{{ shelfTitle }}</p>
        <div
          class="field customise"
          :class="{ open: appearanceOpen }"
          :data-open-band="appearanceOpen ? band : null"
          :inert="appearanceOpen ? undefined : true"
          :aria-hidden="appearanceOpen ? undefined : true"
          @pointerover="onChooserPointer"
          @pointerleave="clearPreviews"
        >
          <CustomisePanel
            id="customise"
            layout="compact"
            v-model:shape="shape"
            v-model:expression="expression"
            v-model:colour="colour"
          />
        </div>

        <div
          class="field motion"
          :class="{ open: band === 'pose' }"
          :inert="band === 'pose' ? undefined : true"
          :aria-hidden="band === 'pose' ? undefined : true"
          @pointerover="onChooserPointer"
          @pointerleave="clearPreviews"
        >
          <AnimationsPalette id="animations" layout="strip" v-model="pose" :colour="frame.colour" />
        </div>
      </div>

      <p class="tagline">{{ t('app.tagline') }}</p>
      <ExportBar
        :kind="desk.kind"
        :formats="status.formats"
        :state="status.state"
        :progress="status.progress"
        :pose="frame.pose"
        :pose-duration="poseDuration"
        :cycle-name="cycleName"
        :cycle-duration="cycleDuration"
        :cycle-block-count="cycleBlockCount"
        @deliver="deliver"
        @annuler="desk.cancelDelivery()"
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
  border-radius: 1.75rem;
  background: var(--stage);
  color: var(--stage-ink);
}

.hero-wrap :deep(.avatar) {
  position: relative;
  z-index: 2;
}

.hero-wrap.bannered {
  min-height: 22rem;
}

.hero-wrap.bannered :deep(.hero-avatar),
.hero-wrap.bannered :deep(.avatar) {
  position: absolute;
  left: 50%;
  top: 44%;
  translate: -50% -50%;
  z-index: 2;
}

.cavity {
  position: absolute;
  inset: 50%;
  translate: -50% -50%;
  z-index: 1;
  color: color-mix(in srgb, var(--stage-muted) 55%, transparent);
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
  background: color-mix(in srgb, #ffffff 88%, var(--stage));
  color: var(--stage-muted);
  font-size: 0.75rem;
  line-height: 1.3;
}

.verbs {
  display: grid;
  gap: 0.15rem;
  width: min(100%, 36rem);
  z-index: 4;
}

.landmarks {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
}

.verbs button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  min-width: 44px;
  min-height: 44px;
  padding: 0.35rem 0.4rem;
  border: 0;
  border-radius: 0.55rem;
  background: transparent;
  color: var(--muted);
  font: inherit;
  font-size: 0.8125rem;
  cursor: pointer;
}

.verbs button.open {
  color: var(--ink);
  font-weight: 500;
}

.verbs button:hover:not(.open) {
  color: var(--ink);
}

.verbs button:focus-visible {
  outline: 2px solid var(--ink);
  outline-offset: 3px;
}

.verbs button:focus-visible::before,
.verbs button:focus-visible::after {
  content: '';
  position: absolute;
  left: 50%;
  width: 0.7rem;
  height: 2px;
  background: var(--ink);
  translate: -50% 0;
}

.verbs button:focus-visible::before {
  bottom: -0.2rem;
}

.verbs button:focus-visible::after {
  bottom: -0.7rem;
}

.landmarks button {
  position: relative;
}

.glyph {
  display: inline-flex;
  flex: 0 0 auto;
  width: 0.9rem;
  height: 0.9rem;
  color: currentColor;
}

.glyph svg {
  display: block;
  width: 100%;
  height: 100%;
}

.label {
  display: inline;
  white-space: nowrap;
}

.spectrum {
  position: relative;
  height: 0.7rem;
  pointer-events: none;
}

.track {
  position: absolute;
  inset-inline: 0.4rem;
  top: 50%;
  height: 3px;
  translate: 0 -50%;
  border-radius: 999px;
  background: var(--spectrum);
  opacity: 0.42;
}

.glint {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 1.85rem;
  height: 3px;
  translate: -50% -50%;
  border-radius: 999px;
  background: var(--accent-display);
  opacity: 0.5;
}

.verbs[data-bead] .glint {
  opacity: 0;
}

.glow {
  position: absolute;
  top: 50%;
  width: 3.25rem;
  height: 4px;
  inset-inline-start: calc((var(--open-index) + 0.5) * 25%);
  translate: -50% -50%;
  border-radius: 999px;
  background: var(--accent-glow);
  opacity: 0;
  transition: inset-inline-start 280ms cubic-bezier(0.22, 1, 0.36, 1);
}

.bead {
  position: absolute;
  top: 50%;
  width: 8px;
  height: 8px;
  inset-inline-start: calc((var(--open-index) + 0.5) * 25%);
  translate: -50% -50%;
  border-radius: 999px;
  background: var(--accent-display);
  box-shadow: 0 0 22px var(--accent-glow);
  opacity: 0;
  transition:
    inset-inline-start 280ms cubic-bezier(0.22, 1, 0.36, 1),
    width 280ms ease;
}

.verbs[data-bead] .glow,
.verbs[data-bead] .bead {
  opacity: 1;
}

.tick {
  position: absolute;
  top: 50%;
  width: 2px;
  height: 7px;
  inset-inline-start: calc((var(--hover-index) + 0.5) * 25%);
  translate: -50% -50%;
  border-radius: 1px;
  background: var(--ink);
  opacity: 0;
}

.verbs[data-tick] .tick {
  opacity: 0.72;
}

.shelf {
  display: grid;
  width: min(100%, 36rem);
  z-index: 3;
}

.shelf-head {
  grid-area: 1 / 1;
  margin: 0 0 0.45rem;
  color: var(--ink);
  font-size: 0.8125rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  text-align: left;
}

.field {
  grid-area: 2 / 1;
  width: 100%;
  max-height: 0;
  overflow: hidden;
  opacity: 0;
  pointer-events: none;
  transform: translateY(0.35rem);
  transition:
    opacity 160ms ease,
    transform 160ms ease;
}

.field.open {
  max-height: min(52vh, 28rem);
  overflow: auto;
  opacity: 1;
  pointer-events: auto;
  transform: none;
}

.field :deep(.rail) {
  max-width: none;
  border-color: color-mix(in srgb, var(--line) 70%, transparent);
  background: color-mix(in srgb, var(--paper) 92%, transparent);
  backdrop-filter: blur(10px);
  box-shadow: 0 12px 40px rgb(var(--wash) / 0.06);
}

.field.customise :deep(#customise-title),
.field.customise :deep(h3),
.field.customise[data-open-band='shape'] :deep(#customise-expression + .tiles),
.field.customise[data-open-band='shape'] :deep(#customise-colour + .swatches),
.field.customise[data-open-band='expression'] :deep(#customise-shape + .tiles),
.field.customise[data-open-band='expression'] :deep(#customise-colour + .swatches),
.field.customise[data-open-band='colour'] :deep(#customise-shape + .tiles),
.field.customise[data-open-band='colour'] :deep(#customise-expression + .tiles) {
  display: none;
}

.tagline {
  margin: 0;
  max-width: 28rem;
  color: var(--muted);
  line-height: 1.5;
}

@media (max-width: 39.99rem) {
  .verbs button {
    font-size: 0.8125rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .bead,
  .glow,
  .tick,
  .glint,
  .field {
    transition: none;
  }
}

@media (prefers-contrast: more) {
  .track {
    opacity: 1;
    background: var(--line);
  }

  .glow {
    display: none;
  }

  .bead {
    box-shadow: none;
    outline: 2px solid var(--ink);
  }
}
</style>
