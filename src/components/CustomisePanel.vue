<script setup lang="ts">
import { computed } from 'vue'
import {
  COLORS,
  EXPRESSIONS,
  SHAPES,
  sampleAvatar,
  viewBoxAttr,
  type ColorId,
  type ExpressionId,
  type ShapeId,
} from '../engine'
import { t, type Cle } from '../i18n'

const shape = defineModel<ShapeId>('shape', { required: true })
const expression = defineModel<ExpressionId>('expression', { required: true })
const colour = defineModel<ColorId>('colour', { required: true })

const formes = computed(() =>
  SHAPES.map((s) => ({
    id: s.id,
    label: t(`shapes.${s.id}` as Cle),
    frame: sampleAvatar({ shape: s.id, expression: expression.value, colour: colour.value }),
  })),
)

const visages = computed(() =>
  EXPRESSIONS.map((e) => ({
    id: e.id,
    label: t(`expressions.${e.id}` as Cle),
    frame: sampleAvatar({ shape: shape.value, expression: e.id, colour: colour.value }),
  })),
)

function oeil(eye: (typeof formes.value)[number]['frame']['eyes'][number]) {
  return `translate(${eye.x} ${eye.y}) matrix(${eye.a} ${eye.b} ${eye.c} ${eye.d} 0 0) rotate(${eye.tilt})`
}

function auClavier<T extends string>(
  liste: readonly T[],
  event: KeyboardEvent,
  index: number,
  choisir: (id: T) => void,
) {
  const pas = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key]
  if (!pas) return
  event.preventDefault()
  const cible = liste[(index + pas + liste.length) % liste.length]!
  choisir(cible)
  const boutons = (event.currentTarget as HTMLElement).parentElement?.children
  const suivant = boutons?.[liste.indexOf(cible)]
  if (suivant instanceof HTMLElement) suivant.focus()
}

const idsFormes = SHAPES.map((s) => s.id)
const idsVisages = EXPRESSIONS.map((e) => e.id)
const idsCouleurs = COLORS.map((c) => c.id)
</script>

<template>
  <aside class="rail surface" data-customise-panel aria-labelledby="customise-title">
    <h2 id="customise-title">{{ t('panel.title') }}</h2>

    <h3 id="customise-shape">{{ t('panel.shape') }}</h3>
    <div class="tiles" role="radiogroup" :aria-label="t('panel.shape')">
      <button
        v-for="(s, i) in formes"
        :key="s.id"
        type="button"
        role="radio"
        :aria-checked="s.id === shape"
        :aria-label="s.label"
        :data-shape="s.id"
        :tabindex="s.id === shape ? 0 : -1"
        :class="{ selected: s.id === shape }"
        @keydown="auClavier(idsFormes, $event, i, (id) => (shape = id))"
        @click="shape = s.id"
      >
        <svg :viewBox="viewBoxAttr()" aria-hidden="true">
          <path :d="s.frame.path" :fill="s.frame.fill" />
          <ellipse
            v-for="(eye, ei) in s.frame.eyes"
            :key="ei"
            cx="0"
            cy="0"
            :rx="eye.rx"
            :ry="eye.ry"
            :opacity="eye.opacity"
            :fill="s.frame.paper"
            :transform="oeil(eye)"
          />
        </svg>
      </button>
    </div>

    <h3 id="customise-expression">{{ t('panel.expression') }}</h3>
    <div class="tiles" role="radiogroup" :aria-label="t('panel.expression')">
      <button
        v-for="(e, i) in visages"
        :key="e.id"
        type="button"
        role="radio"
        :aria-checked="e.id === expression"
        :aria-label="e.label"
        :data-expression="e.id"
        :tabindex="e.id === expression ? 0 : -1"
        :class="{ selected: e.id === expression }"
        @keydown="auClavier(idsVisages, $event, i, (id) => (expression = id))"
        @click="expression = e.id"
      >
        <svg :viewBox="viewBoxAttr()" aria-hidden="true">
          <path :d="e.frame.path" :fill="e.frame.fill" />
          <ellipse
            v-for="(eye, ei) in e.frame.eyes"
            :key="ei"
            cx="0"
            cy="0"
            :rx="eye.rx"
            :ry="eye.ry"
            :opacity="eye.opacity"
            :fill="e.frame.paper"
            :transform="oeil(eye)"
          />
        </svg>
      </button>
    </div>

    <h3 id="customise-colour">{{ t('panel.colour') }}</h3>
    <div class="swatches" role="radiogroup" :aria-label="t('panel.colour')">
      <button
        v-for="(c, i) in COLORS"
        :key="c.id"
        type="button"
        role="radio"
        :aria-checked="c.id === colour"
        :aria-label="t(`colors.${c.id}` as Cle)"
        :data-colour="c.id"
        :tabindex="c.id === colour ? 0 : -1"
        :class="{ selected: c.id === colour }"
        @keydown="auClavier(idsCouleurs, $event, i, (id) => (colour = id))"
        @click="colour = c.id"
      >
        <span class="dot" :style="{ background: c.hex }" />
      </button>
    </div>
  </aside>
</template>

<style scoped>
.rail {
  max-width: var(--rail);
  text-align: left;
}

h2,
h3 {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
}

h3 {
  margin-top: 1.1rem;
}

.tiles,
.swatches {
  display: grid;
  gap: 0.4rem;
  margin-top: 0.5rem;
}

.tiles {
  grid-template-columns: repeat(4, 1fr);
}

.swatches {
  grid-template-columns: repeat(6, 1fr);
}

button {
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
  padding: 0.3rem;
  border: 1px solid var(--line);
  border-radius: 0.75rem;
  background: transparent;
  cursor: pointer;
}

button.selected {
  border-color: var(--ink);
  background: var(--paper);
}

button:hover {
  border-color: var(--muted);
}

svg {
  display: block;
  width: 100%;
  height: auto;
}

.swatches button {
  padding: 0.25rem;
  border-radius: 999px;
  border-color: transparent;
}

.swatches button.selected {
  border-color: var(--ink);
}

.dot {
  display: block;
  width: 78%;
  aspect-ratio: 1;
  border-radius: 999px;
  box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.1);
}
</style>
