<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  BODY_RADIUS,
  DEFAULT_MORPH_MS,
  morphProgress,
  sampleMorph,
  viewBoxAttr,
  type AnimationState,
} from '../engine'

const props = withDefaults(
  defineProps<{
    durationMs?: number
    label?: string
    state?: AnimationState
  }>(),
  { durationMs: DEFAULT_MORPH_MS, label: 'Grok_bot', state: 'Idle' },
)

const from = ref<AnimationState>('Idle')
const to = ref<AnimationState>(props.state)
const startedAt = ref(0)
const now = ref(0)
let raf = 0

const frame = computed(() =>
  sampleMorph(from.value, to.value, morphProgress(now.value - startedAt.value, props.durationMs)),
)

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
  if (props.durationMs > 0) {
    raf = requestAnimationFrame(tick)
  }
}

watch(
  () => props.state,
  (next) => morphTo(next),
)

onMounted(() => {
  const t = performance.now()
  now.value = t
  startedAt.value = t
})

onUnmounted(() => {
  cancelAnimationFrame(raf)
})

defineExpose({ morphTo })
</script>

<template>
  <div class="morph">
    <svg
      class="avatar"
      :viewBox="viewBoxAttr()"
      role="img"
      :aria-label="label"
      :data-state="frame.progress >= 1 ? frame.to : frame.from"
      :data-target="frame.to"
    >
      <path :d="frame.path" fill="#111111" />
      <circle
        v-for="(dot, i) in frame.dots"
        :key="i"
        :cx="dot.x * BODY_RADIUS"
        :cy="dot.y * BODY_RADIUS"
        :r="dot.r * BODY_RADIUS"
        fill="#111111"
        :opacity="dot.opacity"
      />
    </svg>
  </div>
</template>

<style scoped>
.morph {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.avatar {
  display: block;
  width: 220px;
  height: 220px;
}
</style>
