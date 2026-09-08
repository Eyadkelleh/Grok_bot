<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  AvatarEngine,
  BODY_RADIUS,
  DEFAULT_COLOR,
  DEFAULT_EXPRESSION,
  DEFAULT_MORPH_MS,
  DEFAULT_PAPER,
  DEFAULT_SHAPE,
  DEFAULT_SIZE,
  VIEW_HALF,
  VIEW_SIZE,
  colourIdOf,
  gazeAttr,
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
const engine = new AvatarEngine(
  {
    state: (props.state as AnimationState) ?? 'Idle',
    shape: props.shape,
    expression: props.expression,
    gaze: props.gaze,
    colour: props.colour,
    paper: props.paper,
  },
  props.durationMs,
)
const clockT = ref(0)
const stamp = ref(0)
let raf = 0

function bump() {
  stamp.value += 1
}

function appearance() {
  return {
    expression: props.expression,
    gaze: props.gaze,
    colour: props.colour,
    paper: props.paper,
  }
}

function tick(ts: number) {
  clockT.value = ts / 1000
  if (engine.morphingAt(clockT.value)) {
    raf = requestAnimationFrame(tick)
  }
}

function morphTo(nextState: AnimationState, nextShape: string) {
  if (nextState === engine.state && nextShape === engine.shapeId) return
  engine.morphMs = props.durationMs
  const t = performance.now() / 1000
  engine.setState(nextState, t)
  engine.setShape(nextShape, t)
  clockT.value = t
  bump()
  cancelAnimationFrame(raf)
  if (props.durationMs > 0 && engine.morphingAt(t)) raf = requestAnimationFrame(tick)
}

watch(
  () => props.state,
  (next) => {
    if (typeof next === 'string') morphTo(next as AnimationState, engine.shapeId)
  },
)

watch(
  () => props.shape,
  (next) => morphTo(engine.state, next),
)

watch(
  () => props.durationMs,
  (ms) => {
    engine.morphMs = ms
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
  engine.morphMs = props.durationMs
  clockT.value = engine.seek(t, blocks)
  bump()
}

onMounted(() => {
  const now = performance.now() / 1000
  engine.reset(engine.state, now)
  clockT.value = now
})

onUnmounted(() => {
  cancelAnimationFrame(raf)
})

defineExpose({ rendAt })

const frame = computed(() => {
  void stamp.value
  return engine.sample(clockT.value, appearance())
})

const toState = computed(() => {
  void stamp.value
  return engine.state
})

const colourAttr = computed(() => colourIdOf(props.colour, frame.value.colour))
const shownState = computed(() => {
  void stamp.value
  return engine.shownState(clockT.value)
})
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
    :data-target="toState"
    :data-shape-applied="frame.shapeApplied ? 'true' : 'false'"
    :data-geometry-kind="frame.geometryKind"
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
      <linearGradient
        v-for="arc in frame.arcs"
        :id="`${uid}-${arc.id}`"
        :key="arc.id"
        gradientUnits="userSpaceOnUse"
        :x1="arc.grad.x1"
        :y1="arc.grad.y1"
        :x2="arc.grad.x2"
        :y2="arc.grad.y2"
      >
        <stop
          v-for="(c, i) in arc.grad.stops"
          :key="i"
          :offset="i / (arc.grad.stops.length - 1)"
          :stop-color="c"
        />
      </linearGradient>
    </defs>
    <g v-if="frame.arcs.length" fill="none" stroke-linecap="round">
      <path
        v-for="arc in frame.arcs"
        :key="`b${arc.id}`"
        data-arc-back
        :d="arc.back"
        :stroke="`url(#${uid}-${arc.id})`"
        :stroke-width="arc.width"
        :opacity="arc.opacity"
      />
    </g>
    <template v-if="frame.dotsBehind">
      <circle
        v-for="(dot, i) in frame.dots"
        :key="`dot-b-${i}`"
        data-dot
        data-dot-behind
        :cx="dot.x * BODY_RADIUS"
        :cy="dot.y * BODY_RADIUS"
        :r="dot.r * BODY_RADIUS"
        :fill="frame.fill"
        :opacity="dot.opacity"
      />
    </template>
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
    <template v-if="!frame.dotsBehind">
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
    </template>
    <g v-if="frame.arcs.length" fill="none" stroke-linecap="round">
      <path
        v-for="arc in frame.arcs"
        :key="`f${arc.id}`"
        data-arc-front
        :d="arc.front"
        :stroke="`url(#${uid}-${arc.id})`"
        :stroke-width="arc.width"
        :opacity="arc.opacity"
      />
    </g>
  </svg>
</template>

<style scoped>
.avatar {
  display: block;
}
</style>
