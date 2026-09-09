<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, type WritableComputedRef } from 'vue'
import {
  DEFAULT_MORPH_MS,
  isAnimationState,
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
import type { BannerCopy, ImageDesk, LookFacet, PickerBand, VideoDesk } from '../studio'
import { useStageGeometry } from '../ui/useStageGeometry'
import { CADRE_BANNER_PNG, mesureScene, sceneBanniere, type BannerId } from '../ui/scene'
import AnimationsPalette from './AnimationsPalette.vue'
import Avatar from './Avatar.vue'
import BannerBackdrop from './BannerBackdrop.vue'
import CustomisePanel from './CustomisePanel.vue'
import ExportBar from './ExportBar.vue'
import FondPanel from './FondPanel.vue'

const props = defineProps<{
  desk: ImageDesk | VideoDesk
  bannerCopy: BannerCopy
  label: string
  cycleName?: string
  cycleDuration?: number
  cycleBlockCount?: number
  poseDuration: number
}>()

const emit = defineEmits<{ 'banner-copy': [patch: Partial<BannerCopy>] }>()

const stage = ref<HTMLElement | null>(null)
const { size } = useStageGeometry(stage)

const frame = computed(() => props.desk.frame.value)
const band = computed(() => props.desk.band.value)
const status = computed(() => props.desk.delivery.value)

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
const bannerId = facet<BannerId | null>(() => props.desk.config.value.look.banner, 'banner')

const copy = computed({
  get: () => props.bannerCopy,
  set: (next: BannerCopy) => emit('banner-copy', next),
})

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

function setField(next: PickerBand) {
  props.desk.openBand(next)
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
  if (open === 'pose') {
    const id = node?.closest('[data-state]')?.getAttribute('data-state')
    props.desk.preview(id && isAnimationState(id) ? { field: 'pose', value: id } : null)
  }
}

function clearPreviews() {
  props.desk.preview(null)
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

      <div class="verbs" role="toolbar" :aria-label="t('studio.modes')">
        <button
          type="button"
          data-mode="shape"
          :aria-pressed="band === 'shape'"
          :class="{ on: band === 'shape' }"
          @click="setField('shape')"
        >
          {{ t('studio.shape') }}
        </button>
        <button
          type="button"
          data-mode="expression"
          :aria-pressed="band === 'expression'"
          :class="{ on: band === 'expression' }"
          @click="setField('expression')"
        >
          {{ t('studio.face') }}
        </button>
        <button
          type="button"
          data-mode="colour"
          :aria-pressed="band === 'colour'"
          :class="{ on: band === 'colour' }"
          @click="setField('colour')"
        >
          {{ t('studio.aura') }}
        </button>
        <button
          type="button"
          data-mode="fond"
          :aria-pressed="band === 'banner'"
          :class="{ on: band === 'banner' }"
          @click="setField('banner')"
        >
          {{ t('studio.fond') }}
        </button>
        <button
          type="button"
          data-mode="state"
          :aria-pressed="band === 'pose'"
          :class="{ on: band === 'pose' }"
          @click="setField('pose')"
        >
          {{ t('studio.motion') }}
        </button>
      </div>

      <div
        class="field customise"
        :class="{
          open: appearanceOpen,
          orbital: band === 'shape' || band === 'expression',
          skins: band === 'shape',
          faces: band === 'expression',
        }"
        :data-open-band="appearanceOpen ? band : null"
        @pointerover="onChooserPointer"
        @pointerleave="clearPreviews"
      >
        <CustomisePanel
          id="customise"
          v-model:shape="shape"
          v-model:expression="expression"
          v-model:colour="colour"
        />
      </div>

      <div class="field fond" :class="{ open: band === 'banner' }">
        <FondPanel v-model:banner-id="bannerId" v-model:copy="copy" />
      </div>

      <div
        class="field motion"
        :class="{ open: band === 'pose', orbital: band === 'pose', orbits: band === 'pose' }"
        @pointerover="onChooserPointer"
        @pointerleave="clearPreviews"
      >
        <AnimationsPalette id="animations" v-model="pose" :colour="frame.colour" />
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
        @deliver="desk.deliver($event as never)"
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

.field.fond {
  left: 0;
  top: 4.5rem;
}

.field.fond :deep([data-fond-panel]) {
  max-width: none;
  border-color: color-mix(in srgb, var(--line) 70%, transparent);
  background: color-mix(in srgb, var(--paper) 82%, transparent);
  backdrop-filter: blur(10px);
  box-shadow: 0 12px 40px rgb(var(--wash) / 0.06);
}

@media (max-width: 40rem) {
  .field.fond {
    left: 50%;
    right: auto;
    top: auto;
    bottom: 7.5rem;
    width: min(100% - 1rem, 22rem);
    translate: -50% 0;
  }
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
  background: color-mix(in srgb, #ffffff 88%, transparent);
  color: var(--stage-muted);
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
  box-shadow: 0 12px 40px rgb(var(--wash) / 0.06);
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
