<script setup lang="ts">
import { computed } from 'vue'
import {
  ANIMATION_STATES,
  BODY_RADIUS,
  COLORS,
  COLOR_BY_ID,
  DEFAULT_COLOR,
  isColorId,
  sampleMorph,
  viewBoxAttr,
  type AnimationState,
  type ColorId,
} from '../engine'
import { t, type Cle } from '../i18n'

const selected = defineModel<AnimationState>({ default: 'Idle' })
const colour = defineModel<ColorId>('colour', { default: DEFAULT_COLOR })

const fill = computed(() => {
  const id = isColorId(colour.value) ? colour.value : DEFAULT_COLOR
  return COLOR_BY_ID.get(id)?.hex ?? COLORS[0]!.hex
})

const poses = computed(() =>
  ANIMATION_STATES.map((id) => ({
    id,
    label: t(`animations.${id}` as Cle),
    frame: sampleMorph(id, id, 1),
  })),
)

function auClavier(event: KeyboardEvent, index: number) {
  const pas = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key]
  if (!pas) return
  event.preventDefault()
  const cible = ANIMATION_STATES[(index + pas + ANIMATION_STATES.length) % ANIMATION_STATES.length]!
  selected.value = cible
  const boutons = (event.currentTarget as HTMLElement).parentElement?.children
  const suivant = boutons?.[ANIMATION_STATES.indexOf(cible)]
  if (suivant instanceof HTMLElement) suivant.focus()
}
</script>

<template>
  <aside class="rail surface" data-animations-palette aria-labelledby="animations-title">
    <h2 id="animations-title">{{ t('animations.title') }}</h2>
    <div class="swatches" role="radiogroup" :aria-label="t('animations.label')">
      <button
        v-for="(pose, i) in poses"
        :key="pose.id"
        type="button"
        role="radio"
        :aria-checked="pose.id === selected"
        :aria-label="pose.label"
        :data-state="pose.id"
        :tabindex="pose.id === selected ? 0 : -1"
        :class="{ selected: pose.id === selected }"
        @keydown="auClavier($event, i)"
        @click="selected = pose.id"
      >
        <svg :viewBox="viewBoxAttr()" aria-hidden="true">
          <path :d="pose.frame.path" :fill="fill" />
          <circle
            v-for="(dot, di) in pose.frame.dots"
            :key="di"
            :cx="dot.x * BODY_RADIUS"
            :cy="dot.y * BODY_RADIUS"
            :r="dot.r * BODY_RADIUS"
            :fill="fill"
            :opacity="dot.opacity"
          />
        </svg>
        <span>{{ pose.label }}</span>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.rail {
  max-width: var(--rail);
  text-align: left;
}

h2 {
  margin: 0 0 0.65rem;
  font-size: 0.875rem;
  font-weight: 600;
}

.swatches {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.4rem;
}

button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  padding: 0.55rem 0.4rem 0.5rem;
  border: 1px solid var(--line);
  border-radius: 0.75rem;
  background: transparent;
  color: var(--muted);
  font: inherit;
  font-size: 0.75rem;
  cursor: pointer;
}

button.selected {
  border-color: var(--ink);
  background: var(--paper);
  color: var(--ink);
  font-weight: 500;
}

button:hover {
  border-color: var(--muted);
}

svg {
  display: block;
  width: 2.5rem;
  height: 2.5rem;
}
</style>
