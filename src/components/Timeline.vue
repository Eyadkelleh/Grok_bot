<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import {
  blockAt,
  blocksWith,
  makeBlock,
  nextCycleId,
  offsetOf,
  parseMontage,
  serializeMontage,
  totalDuration,
  uniqueName,
  mmss,
  type AnimationState,
  type Block,
  type Cycle,
} from '../engine'
import { ecris, lis } from '../i18n/stockage'
import { nomDeCycle, t } from '../i18n'
import TimelineTrack from './TimelineTrack.vue'

const state = defineModel<AnimationState>('state', { required: true })
const playing = defineModel<boolean>('playing', { required: true })

const stored = parseMontage(lis('cycles'))
const cycles = ref<Cycle[]>(stored.cycles)
const activeId = ref(stored.activeId)
const block = ref(0)
const elapsed = ref(0)
const zoom = ref(1)
const naming = ref<'create' | 'rename' | null>(null)
const nameDraft = ref('')
const confirmRemove = ref(false)

const cycle = computed(() => cycles.value.find((c) => c.id === activeId.value) ?? cycles.value[0]!)
const blocks = computed(() => cycle.value.blocks)
const total = computed(() => totalDuration(blocks.value))
const at = computed(() => offsetOf(blocks.value, block.value) + elapsed.value)

let raf = 0
let originWall = 0
let originClock = 0

function persist() {
  ecris('cycles', serializeMontage({ activeId: activeId.value, cycles: cycles.value }))
}

watch([cycles, activeId], persist, { deep: true })

function edit(next: Partial<Cycle>) {
  cycles.value = cycles.value.map((c) => (c.id === cycle.value.id ? { ...c, ...next } : c))
}

function sample(t: number) {
  const hit = blockAt(blocks.value, t)
  block.value = hit.index
  elapsed.value = hit.elapsed
  const next = blocks.value[hit.index]?.state
  if (next && next !== state.value) state.value = next
}

function loop(ts: number) {
  sample(originClock + (ts - originWall) / 1000)
  raf = requestAnimationFrame(loop)
}

function startClock() {
  cancelAnimationFrame(raf)
  originWall = performance.now()
  originClock = at.value
  raf = requestAnimationFrame(loop)
}

function stopClock() {
  cancelAnimationFrame(raf)
  raf = 0
}

watch(playing, (on) => {
  if (on) {
    const current = blocks.value[block.value]?.state
    if (current) state.value = current
    startClock()
  } else {
    stopClock()
  }
})

watch(activeId, () => {
  playing.value = false
  block.value = 0
  elapsed.value = 0
  const first = blocks.value[0]?.state
  if (first) state.value = first
})

onUnmounted(stopClock)

function seek(seconds: number) {
  const hit = blockAt(blocks.value, seconds)
  originClock = offsetOf(blocks.value, hit.index) + hit.elapsed
  originWall = performance.now()
  sample(originClock)
}

function togglePlay() {
  playing.value = !playing.value
}

function selectCycle(id: string) {
  activeId.value = id
}

function askCreate() {
  naming.value = 'create'
  nameDraft.value = uniqueName(t('cycles.newName'), cycles.value)
}

function askRename() {
  naming.value = 'rename'
  nameDraft.value = nomDeCycle(cycle.value)
}

function createCycle() {
  const name = uniqueName(nameDraft.value.trim() || t('cycles.newName'), cycles.value)
  const neuf: Cycle = {
    id: nextCycleId(cycles.value),
    name,
    blocks: [makeBlock('Idle')],
  }
  cycles.value = [...cycles.value, neuf]
  naming.value = null
  selectCycle(neuf.id)
}

function renameCycle() {
  const unique = uniqueName(
    nameDraft.value.trim() || t('cycles.newName'),
    cycles.value.filter((c) => c.id !== cycle.value.id),
  )
  edit({ name: unique })
  naming.value = null
}

function removeCycle() {
  if (cycles.value.length < 2) return
  const reste = cycles.value.filter((c) => c.id !== cycle.value.id)
  cycles.value = reste
  confirmRemove.value = false
  selectCycle(reste[0]!.id)
}

function onBlocks(next: Block[]) {
  edit({ blocks: next })
}

function addBlock(s: AnimationState) {
  edit({ blocks: blocksWith(blocks.value, s) })
}

defineExpose({ seek, sample, block, elapsed, cycles, activeId, cycle })
</script>

<template>
  <section class="bar" data-timeline :aria-label="t('timeline.cycles')">
    <div class="transport">
      <span class="clock now" data-clock>{{ mmss(at) }}</span>
      <button
        type="button"
        data-play
        class="play"
        :aria-pressed="playing ? 'true' : 'false'"
        :aria-label="playing ? t('timeline.pause') : t('timeline.play')"
        @click="togglePlay"
      >
        <svg v-if="!playing" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M21.4086 9.35258C23.5305 10.5065 23.5305 13.4935 21.4086 14.6474L8.59662 21.6145C6.53435 22.736 4 21.2763 4 18.9671L4 5.0329C4 2.72368 6.53435 1.26402 8.59661 2.38548L21.4086 9.35258Z"
          />
        </svg>
        <svg v-else width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
          <g fill="currentColor">
            <path
              d="M2 6C2 4.11438 2 3.17157 2.58579 2.58579C3.17157 2 4.11438 2 6 2C7.88562 2 8.82843 2 9.41421 2.58579C10 3.17157 10 4.11438 10 6V18C10 19.8856 10 20.8284 9.41421 21.4142C8.82843 22 7.88562 22 6 22C4.11438 22 3.17157 22 2.58579 21.4142C2 20.8284 2 19.8856 2 18V6Z"
            />
            <path
              d="M14 6C14 4.11438 14 3.17157 14.5858 2.58579C15.1716 2 16.1144 2 18 2C19.8856 2 20.8284 2 21.4142 2.58579C22 3.17157 22 4.11438 22 6V18C22 19.8856 22 20.8284 21.4142 21.4142C20.8284 22 19.8856 22 18 22C16.1144 22 15.1716 22 14.5858 21.4142C14 20.8284 14 19.8856 14 18V6Z"
            />
          </g>
        </svg>
      </button>
      <span class="clock total" data-total>{{ mmss(total) }}</span>
    </div>

    <div class="tools">
      <div class="cycles">
        <label class="sr" for="cycle-select">{{ t('timeline.cycles') }}</label>
        <select id="cycle-select" data-cycle-select :value="activeId" @change="selectCycle(($event.target as HTMLSelectElement).value)">
          <option v-for="c in cycles" :key="c.id" :value="c.id" :data-cycle="c.id">
            {{ nomDeCycle(c) }}
          </option>
        </select>
        <button type="button" data-cycle-new @click="askCreate">{{ t('cycles.menuNew') }}</button>
        <button
          type="button"
          data-cycle-rename
          :aria-label="t('cycles.menuRenameAria', { name: nomDeCycle(cycle) })"
          @click="askRename"
        >
          {{ t('dialog.nameRename') }}
        </button>
        <button
          type="button"
          data-cycle-remove
          :disabled="cycles.length < 2"
          :aria-label="t('cycles.menuRemoveAria', { name: nomDeCycle(cycle) })"
          @click="confirmRemove = true"
        >
          {{ t('dialog.removeConfirm') }}
        </button>
      </div>
      <p class="readout">
        <span>{{ mmss(at) }}</span> / {{ mmss(total) }}
      </p>
    </div>

    <form
      v-if="naming"
      class="dialog"
      data-cycle-form
      @submit.prevent="naming === 'rename' ? renameCycle() : createCycle()"
    >
      <label for="cycle-name">{{ t('dialog.nameField') }}</label>
      <input id="cycle-name" v-model="nameDraft" data-cycle-name maxlength="80" />
      <button type="submit" data-cycle-save>
        {{ naming === 'rename' ? t('dialog.nameRename') : t('dialog.nameCreate') }}
      </button>
      <button type="button" data-cycle-cancel @click="naming = null">{{ t('dialog.cancel') }}</button>
    </form>

    <form v-if="confirmRemove" class="dialog" data-cycle-confirm @submit.prevent="removeCycle()">
      <p>{{ t('dialog.removeTitle', { name: nomDeCycle(cycle) }) }}</p>
      <p>{{ t('dialog.removeDetail', { n: blocks.length }) }}</p>
      <button type="submit" data-cycle-confirm-yes>{{ t('dialog.removeConfirm') }}</button>
      <button type="button" @click="confirmRemove = false">{{ t('dialog.cancel') }}</button>
    </form>

    <TimelineTrack
      v-model:block="block"
      v-model:zoom="zoom"
      :blocks="blocks"
      :elapsed="elapsed"
      :add-state="state"
      @update:blocks="onBlocks"
      @add="addBlock"
      @seek="seek"
    />
  </section>
</template>

<style scoped>
.bar {
  position: fixed;
  inset-inline: 0;
  bottom: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
  padding: 0.85rem 1.25rem 1.15rem;
  border-top: 1px solid var(--line);
  background: var(--paper);
  box-shadow: 0 -8px 24px rgb(0 0 0 / 0.04);
}

.transport {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.85rem;
}

.clock {
  font-size: 0.875rem;
  font-variant-numeric: tabular-nums;
}

.clock.total {
  color: var(--muted);
}

.play {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  border: 0;
  border-radius: 999px;
  background: var(--ink);
  color: var(--paper);
  cursor: pointer;
}

.play:hover {
  transform: scale(1.05);
}

.tools {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.cycles {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
}

.cycles select,
.cycles button,
.dialog input,
.dialog button {
  padding: 0.35rem 0.65rem;
  border: 1px solid var(--line);
  border-radius: 0.75rem;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 0.8rem;
  cursor: pointer;
}

.cycles select {
  cursor: pointer;
}

.cycles button:disabled {
  opacity: 0.4;
  cursor: default;
}

.readout {
  margin: 0;
  color: var(--muted);
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
}

.readout span {
  color: var(--ink);
}

.dialog {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
}

.dialog p {
  margin: 0;
}

.sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
}
</style>
