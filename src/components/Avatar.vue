<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  BODY_RADIUS,
  DEFAULT_COLOR,
  DEFAULT_EXPRESSION,
  DEFAULT_MORPH_MS,
  DEFAULT_PAPER,
  DEFAULT_SHAPE,
  DEFAULT_SIZE,
  VIEW_HALF,
  VIEW_SIZE,
  blockAt,
  colourIdOf,
  gazeAttr,
  morphProgress,
  sampleAvatar,
  sampleMorph,
  type AnimationState,
  type Block,
  type GazeInput,
} from '../engine'

const props = withDefaults(
  defineProps<{
    size?: number
    shape?: string
    expression?: string
    gaze?: GazeInput
    colour?: string
    state?: AnimationState | string
    paper?: string
    label?: string
    durationMs?: number
  }>(),
  {
    size: DEFAULT_SIZE,
    shape: DEFAULT_SHAPE,
    expression: DEFAULT_EXPRESSION,
    colour: DEFAULT_COLOR,
    state: 'Idle',
    paper: DEFAULT_PAPER,
    label: 'Grok_bot',
    durationMs: DEFAULT_MORPH_MS,
  },
)

const uid = `avatar-mask-${Math.random().toString(36).slice(2, 10)}`
const initial = (props.state as AnimationState) ?? 'Idle'
const from = ref<AnimationState>(initial)
const to = ref<AnimationState>(initial)
const startedAt = ref(0)
const now = ref(0)
let raf = 0

function tick(ts: number) {
  now.value = ts
  if (morphProgress(ts - startedAt.value, props.durationMs) < 1) {
    raf = requestAnimationFrame(tick)
  }
}

function morphTo(next: AnimationState) {
  if (next === to.value) return
  from.value = to.value
  to.value = next
  const t = performance.now()
  startedAt.value = t
  now.value = t
  cancelAnimationFrame(raf)
  if (props.durationMs > 0) raf = requestAnimationFrame(tick)
}

watch(
  () => props.state,
  (next) => {
    if (typeof next === 'string') morphTo(next as AnimationState)
  },
)

/**
 * Seek the bot to an absolute date on a montage. Cancels the live rAF loop so
 * export can step frame by frame. The first block is already settled: previous
 * is itself, so t=0 does not morph in from a state that was never shown.
 */
function rendAt(t: number, blocks: Block[]) {
  cancelAnimationFrame(raf)
  raf = 0
  const hit = blockAt(blocks, t)
  const current = blocks[hit.index]?.state ?? 'Idle'
  const prev = hit.index > 0 ? (blocks[hit.index - 1]?.state ?? current) : current
  const morphDone = hit.index === 0 || hit.elapsed * 1000 + 1e-6 >= props.durationMs
  from.value = morphDone ? current : prev
  to.value = current
  startedAt.value = 0
  now.value = morphDone ? props.durationMs : hit.elapsed * 1000
}

onMounted(() => {
  const t = performance.now()
  now.value = t
  startedAt.value = t
})

onUnmounted(() => {
  cancelAnimationFrame(raf)
})

defineExpose({ rendAt })

const progress = computed(() => {
  if (from.value === to.value) return 1
  return morphProgress(now.value - startedAt.value, props.durationMs)
})

const rest = computed(() =>
  sampleAvatar({
    shape: props.shape,
    expression: props.expression,
    gaze: props.gaze,
    colour: props.colour,
    state: to.value,
    paper: props.paper,
  }),
)

const frame = computed(() => {
  if (progress.value >= 1) return rest.value
  const morph = sampleMorph(from.value, to.value, progress.value)
  return {
    ...rest.value,
    path: morph.path,
    dots: morph.dots,
    eyes: [] as typeof rest.value.eyes,
  }
})

const colourAttr = computed(() => colourIdOf(props.colour, frame.value.colour))
const shownState = computed(() => (progress.value >= 1 ? to.value : from.value))
</script>

<template>
  <svg
    class="avatar"
    :width="size"
    :height="size"
    :viewBox="frame.viewBox"
    role="img"
    :aria-label="label"
    :data-size="size"
    :data-shape="frame.shape"
    :data-expression="frame.expression"
    :data-colour="colourAttr"
    :data-gaze="gazeAttr(frame.gaze)"
    :data-state="shownState"
    :data-target="to"
  >
    <defs>
      <mask
        :id="uid"
        maskUnits="userSpaceOnUse"
        :x="-VIEW_HALF"
        :y="-VIEW_HALF"
        :width="VIEW_SIZE"
        :height="VIEW_SIZE"
      >
        <path :d="frame.path" fill="#fff" />
        <ellipse
          v-for="(eye, i) in frame.eyes"
          :key="i"
          data-eye
          cx="0"
          cy="0"
          :rx="eye.rx"
          :ry="eye.ry"
          :opacity="eye.opacity"
          fill="#000"
          :transform="`translate(${eye.x} ${eye.y}) matrix(${eye.a} ${eye.b} ${eye.c} ${eye.d} 0 0) rotate(${eye.tilt})`"
        />
      </mask>
    </defs>
    <path data-body-paper :d="frame.path" :fill="frame.paper" />
    <g :mask="`url(#${uid})`">
      <rect
        data-body
        :x="-VIEW_HALF"
        :y="-VIEW_HALF"
        :width="VIEW_SIZE"
        :height="VIEW_SIZE"
        :fill="frame.fill"
      />
    </g>
    <circle
      v-for="(dot, i) in frame.dots"
      :key="`dot-${i}`"
      data-dot
      :cx="dot.x * BODY_RADIUS"
      :cy="dot.y * BODY_RADIUS"
      :r="dot.r * BODY_RADIUS"
      :fill="frame.fill"
      :opacity="dot.opacity"
    />
  </svg>
</template>

<style scoped>
.avatar {
  display: block;
}
</style>
