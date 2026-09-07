<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  ANIMATION_STATES,
  BASE_SCALE,
  BODY_RADIUS,
  STEP,
  clampDuration,
  clampZoom,
  moveBlock,
  offsetOf,
  sampleMorph,
  ticksFor,
  totalDuration,
  viewBoxAttr,
  type AnimationState,
  type Block,
} from '../engine'
import { secondes, secondesCourtes, t, type Cle } from '../i18n'

const props = defineProps<{
  blocks: Block[]
  elapsed: number
  addState: AnimationState
}>()

const emit = defineEmits<{
  'update:blocks': [blocks: Block[]]
  seek: [seconds: number]
  add: [state: AnimationState]
}>()

const block = defineModel<number>('block', { required: true })
const zoom = defineModel<number>('zoom', { required: true })

const scale = computed(() => BASE_SCALE * zoom.value)
const total = computed(() => totalDuration(props.blocks))
const at = computed(() => offsetOf(props.blocks, block.value) + props.elapsed)
const ticks = computed(() => ticksFor(total.value, scale.value))
const poses = computed(() =>
  ANIMATION_STATES.map((id) => ({
    id,
    label: t(`animations.${id}` as Cle),
    frame: sampleMorph(id, id, 1),
  })),
)

const track = ref<HTMLElement | null>(null)
const pickerOpen = ref(false)

function width(index: number) {
  return props.blocks[index]!.duration * scale.value
}

function label(index: number) {
  return t(`animations.${props.blocks[index]!.state}` as Cle)
}

const addAria = computed(() =>
  t('timeline.addAnimationNamed', {
    state: t(`animations.${props.addState}` as Cle),
  }),
)

function frameOf(state: AnimationState) {
  return sampleMorph(state, state, 1)
}

function onWheel(e: WheelEvent) {
  const el = track.value
  if (!el) return
  const unit = e.deltaMode === 1 ? 16 : 1
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault()
    zoom.value = clampZoom(zoom.value * Math.exp((-e.deltaY * unit) / 180))
    return
  }
  if (el.scrollWidth <= el.clientWidth) return
  const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
  if (!d) return
  e.preventDefault()
  el.scrollLeft += d * unit
}

watch(block, () => {
  const el = track.value
  if (!el) return
  const x = offsetOf(props.blocks, block.value) * scale.value
  if (x < el.scrollLeft || x + width(block.value) > el.scrollLeft + el.clientWidth) {
    el.scrollLeft = Math.max(0, x - 24)
  }
})

onMounted(() => {
  track.value?.addEventListener('wheel', onWheel, { passive: false })
})

onUnmounted(() => {
  track.value?.removeEventListener('wheel', onWheel)
})

function removeBlock(index: number) {
  if (props.blocks.length < 2) return
  emit(
    'update:blocks',
    props.blocks.filter((_, i) => i !== index),
  )
  if (index < block.value) block.value -= 1
  else if (block.value >= props.blocks.length - 1) block.value = props.blocks.length - 2
}

function setDuration(index: number, wanted: number) {
  const b = props.blocks[index]
  if (!b) return
  const duration = clampDuration(b.state, wanted)
  if (duration === b.duration) return
  emit(
    'update:blocks',
    props.blocks.map((old, i) => (i === index ? { ...old, duration } : old)),
  )
}

function shift(index: number, delta: number) {
  const cible = index + delta
  if (cible < 0 || cible >= props.blocks.length) return
  emit('update:blocks', moveBlock(props.blocks, index, cible))
  if (block.value === index) block.value = cible
}

async function onCardKey(index: number, e: KeyboardEvent) {
  const sens = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0
  if (!sens) return
  e.preventDefault()
  if (!e.altKey) {
    emit('seek', Math.max(0, Math.min(total.value - 0.001, at.value + sens * STEP)))
    return
  }
  shift(index, sens)
  await nextTick()
  const liste = track.value?.querySelectorAll<HTMLButtonElement>('[data-carte]')
  liste?.[index + sens]?.focus()
}

function pointerSeconds(e: PointerEvent) {
  const box = track.value?.getBoundingClientRect()
  if (!box) return 0
  return (e.clientX - box.left + (track.value?.scrollLeft ?? 0)) / scale.value
}

const scrubbing = ref(false)

function scrubTo(e: PointerEvent) {
  emit('seek', Math.max(0, Math.min(total.value - 0.001, pointerSeconds(e))))
}

function onRulerDown(e: PointerEvent) {
  e.preventDefault()
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  scrubbing.value = true
  scrubTo(e)
}

function pick(state: AnimationState) {
  pickerOpen.value = false
  emit('add', state)
}
</script>

<template>
  <div class="track-wrap">
    <div ref="track" class="track" data-track @pointerdown.middle.prevent>
      <div class="inner" :style="{ width: `${total * scale + 76}px` }">
        <div
          class="ruler"
          data-ruler
          @pointerdown="onRulerDown"
          @pointermove="scrubbing && scrubTo($event)"
          @pointerup="scrubbing = false"
          @pointercancel="scrubbing = false"
        >
          <span
            v-for="tick in ticks"
            :key="tick.t"
            class="tick"
            :class="{ major: tick.major }"
            :style="{ transform: `translateX(${tick.t * scale}px)` }"
          >
            <span class="mark" />
            <span v-if="tick.major" class="tick-label">{{ secondesCourtes(tick.t) }}</span>
          </span>
        </div>

        <ul class="cards">
          <li
            v-for="(b, i) in blocks"
            :key="`${i}-${b.state}`"
            class="card"
            :class="{ current: i === block }"
            :style="{ width: `${b.duration * scale}px` }"
            :data-block="i"
            :data-state="b.state"
          >
            <button
              type="button"
              class="hit"
              data-carte
              :aria-current="i === block ? 'true' : undefined"
              :aria-label="t('timeline.blockAria', { state: label(i), duration: secondes(b.duration) })"
              aria-keyshortcuts="Alt+ArrowLeft Alt+ArrowRight ArrowLeft ArrowRight"
              @click="emit('seek', offsetOf(props.blocks, i))"
              @keydown.enter.prevent="emit('seek', offsetOf(props.blocks, i))"
              @keydown.space.prevent="emit('seek', offsetOf(props.blocks, i))"
              @keydown.left="onCardKey(i, $event)"
              @keydown.right="onCardKey(i, $event)"
            >
              <svg :viewBox="viewBoxAttr()" aria-hidden="true">
                <path :d="frameOf(b.state).path" fill="currentColor" />
                <circle
                  v-for="(dot, di) in frameOf(b.state).dots"
                  :key="di"
                  :cx="dot.x * BODY_RADIUS"
                  :cy="dot.y * BODY_RADIUS"
                  :r="dot.r * BODY_RADIUS"
                  fill="currentColor"
                  :opacity="dot.opacity"
                />
              </svg>
              <span class="dur">{{ secondes(b.duration) }}</span>
            </button>

            <label class="duration">
              <span class="sr">{{
                t('timeline.blockDurationAria', { state: label(i), duration: secondes(b.duration) })
              }}</span>
              <input
                type="number"
                data-duration
                :min="0.4"
                :max="10"
                :step="STEP"
                :value="b.duration"
                @change="setDuration(i, Number(($event.target as HTMLInputElement).value))"
              />
            </label>

            <div class="ops">
              <button
                type="button"
                data-move="left"
                :disabled="i === 0"
                :aria-label="t('timeline.moveLeft', { state: label(i) })"
                @click="shift(i, -1)"
              >
                ‹
              </button>
              <button
                type="button"
                data-move="right"
                :disabled="i === blocks.length - 1"
                :aria-label="t('timeline.moveRight', { state: label(i) })"
                @click="shift(i, 1)"
              >
                ›
              </button>
              <button
                v-if="blocks.length > 1"
                type="button"
                data-remove
                :aria-label="t('timeline.blockRemoveAria', { state: label(i) })"
                @click="removeBlock(i)"
              >
                ×
              </button>
            </div>
          </li>

          <li class="adder">
            <button
              type="button"
              data-add
              :data-add-state="addState"
              :aria-label="addAria"
              @click="emit('add', addState)"
            >
              +
            </button>
            <button
              type="button"
              class="add-menu"
              data-add-menu
              :aria-expanded="pickerOpen"
              :aria-label="t('timeline.addAnimation')"
              @click="pickerOpen = !pickerOpen"
            >
              ▾
            </button>
            <div v-if="pickerOpen" class="picker" data-picker role="listbox" :aria-label="t('timeline.addAnimation')">
              <button
                v-for="pose in poses"
                :key="pose.id"
                type="button"
                role="option"
                :data-pick="pose.id"
                :aria-label="pose.label"
                @click="pick(pose.id)"
              >
                {{ pose.label }}
              </button>
            </div>
          </li>
        </ul>

        <div class="playhead" data-playhead :style="{ transform: `translateX(${at * scale}px)` }" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.track-wrap {
  position: relative;
  flex: 1;
  min-height: 5.5rem;
}

.track {
  height: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
}

.track::-webkit-scrollbar {
  display: none;
}

.inner {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 100%;
}

.ruler {
  position: relative;
  flex-shrink: 0;
  height: 1.5rem;
  cursor: ew-resize;
  user-select: none;
}

.tick {
  position: absolute;
  bottom: 0.2rem;
  display: flex;
  align-items: flex-end;
  gap: 0.2rem;
}

.mark {
  display: block;
  width: 1px;
  height: 0.35rem;
  background: var(--line);
}

.tick.major .mark {
  height: 0.7rem;
}

.tick-label {
  font-size: 0.7rem;
  line-height: 1;
  color: var(--muted);
}

.cards {
  display: flex;
  flex: 1;
  align-items: stretch;
  margin: 0;
  padding: 0;
  list-style: none;
}

.card {
  position: relative;
  flex-shrink: 0;
  min-width: 4.5rem;
  padding-right: 0.25rem;
}

.hit {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 3.5rem;
  padding: 0.3rem 0.35rem;
  overflow: hidden;
  border: 1px solid transparent;
  border-radius: 0.5rem;
  background: rgb(0 0 0 / 0.045);
  color: var(--muted);
  font: inherit;
  cursor: pointer;
}

.card.current .hit {
  border-color: var(--ink);
  background: var(--paper);
  color: var(--ink);
}

.hit svg {
  display: block;
  width: 1.75rem;
  height: 1.75rem;
}

.dur {
  font-size: 0.7rem;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}

.duration {
  display: block;
  margin-top: 0.15rem;
}

.duration input {
  width: 100%;
  padding: 0.1rem 0.2rem;
  border: 1px solid var(--line);
  border-radius: 0.35rem;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 0.7rem;
  font-variant-numeric: tabular-nums;
  text-align: center;
}

.ops {
  position: absolute;
  top: 0.15rem;
  right: 0.35rem;
  display: none;
  gap: 0.1rem;
}

.card:hover .ops,
.card:focus-within .ops {
  display: flex;
}

.ops button {
  width: 1.15rem;
  height: 1.15rem;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: rgb(0 0 0 / 0.1);
  color: var(--ink);
  font: inherit;
  font-size: 0.75rem;
  line-height: 1;
  cursor: pointer;
}

.ops button:disabled {
  opacity: 0.35;
  cursor: default;
}

.adder {
  position: relative;
  display: flex;
  flex-shrink: 0;
  gap: 0.15rem;
  width: 5.5rem;
  padding-left: 0.25rem;
}

.adder > [data-add] {
  flex: 1;
  height: 3.5rem;
  border: 1px dashed var(--line);
  border-radius: 0.5rem;
  background: transparent;
  color: var(--muted);
  font: inherit;
  font-size: 1.25rem;
  cursor: pointer;
}

.add-menu {
  width: 1.4rem;
  height: 3.5rem;
  padding: 0;
  border: 1px dashed var(--line);
  border-radius: 0.5rem;
  background: transparent;
  color: var(--muted);
  font: inherit;
  cursor: pointer;
}

.picker {
  position: absolute;
  bottom: 100%;
  left: 0;
  z-index: 4;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.2rem;
  width: 12rem;
  max-height: 12rem;
  overflow: auto;
  padding: 0.4rem;
  margin-bottom: 0.35rem;
  border: 1px solid var(--line);
  border-radius: 0.75rem;
  background: var(--paper);
  box-shadow: 0 8px 24px rgb(0 0 0 / 0.08);
}

.picker button {
  padding: 0.3rem 0.4rem;
  border: 0;
  border-radius: 0.4rem;
  background: transparent;
  color: var(--ink);
  font: inherit;
  font-size: 0.75rem;
  text-align: left;
  cursor: pointer;
}

.picker button:hover {
  background: rgb(0 0 0 / 0.06);
}

.playhead {
  pointer-events: none;
  position: absolute;
  inset-block: 0;
  left: 0;
  width: 2px;
  border-radius: 999px;
  background: var(--ink);
}

.playhead::before {
  content: '';
  position: absolute;
  top: 0;
  left: -5px;
  width: 0.75rem;
  height: 0.75rem;
  border: 2px solid var(--paper);
  border-radius: 999px;
  background: var(--ink);
}

.sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
}
</style>
