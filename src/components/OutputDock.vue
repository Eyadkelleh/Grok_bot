<script setup lang="ts">
import { computed } from 'vue'
import { COLOR_BY_ID, type ColorId } from '../engine'
import { secondesCourtes, t } from '../i18n'
import { hrefForDesk, type DeskKind } from '../studio'

const props = defineProps<{
  focus: DeskKind
  imageColour: ColorId
  videoColour: ColorId
  videoDuration: number
}>()

const emit = defineEmits<{ focus: [kind: DeskKind] }>()

const hex = (id: ColorId) => COLOR_BY_ID.get(id)?.hex ?? '#1c1917'

const desks = computed(() => [
  {
    kind: 'image' as const,
    label: t('dock.image'),
    aria: t('dock.imageAria'),
    hint: t('dock.imageHint'),
    tint: hex(props.imageColour),
  },
  {
    kind: 'video' as const,
    label: t('dock.video'),
    aria: t('dock.videoAria'),
    hint: `${t('dock.videoHint')} · ${secondesCourtes(props.videoDuration)}`,
    tint: hex(props.videoColour),
  },
])
</script>

<template>
  <nav class="dock" data-output-dock :aria-label="t('dock.label')">
    <a
      v-for="desk in desks"
      :key="desk.kind"
      class="sheet"
      :class="{ on: desk.kind === focus }"
      :href="hrefForDesk(desk.kind)"
      :data-desk="desk.kind"
      :aria-current="desk.kind === focus ? 'page' : undefined"
      :aria-label="desk.aria"
      @click.prevent="emit('focus', desk.kind)"
    >
      <svg class="leaf" viewBox="0 0 28 34" aria-hidden="true" focusable="false">
        <path
          class="page"
          d="M2 3.5A2.5 2.5 0 0 1 4.5 1H18l8 8v21.5A2.5 2.5 0 0 1 23.5 33h-19A2.5 2.5 0 0 1 2 30.5Z"
        />
        <path class="fold" d="M18 1l8 8h-8Z" />
        <circle class="tint" cx="14" cy="20" r="5.5" :style="{ fill: desk.tint }" />
      </svg>
      <span class="name">{{ desk.label }}</span>
      <span class="hint">{{ desk.hint }}</span>
    </a>
  </nav>
</template>

<style scoped>
.dock {
  display: flex;
  gap: 0.5rem;
}

.sheet {
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: auto auto;
  align-items: center;
  gap: 0 0.6rem;
  padding: 0.45rem 0.85rem 0.45rem 0.6rem;
  border: 1px solid var(--line);
  border-radius: 0.85rem;
  background: transparent;
  color: var(--muted);
  text-decoration: none;
  transition:
    border-color 160ms ease,
    color 160ms ease,
    background 160ms ease,
    transform 160ms ease;
}

.sheet:hover,
.sheet:focus-visible {
  border-color: var(--muted);
  color: var(--ink);
  transform: translateY(-1px);
}

.sheet.on {
  border-color: var(--ink);
  background: var(--paper);
  color: var(--ink);
}

.leaf {
  grid-row: 1 / 3;
  width: 1.6rem;
  height: auto;
}

.leaf .page {
  fill: var(--paper);
  stroke: currentColor;
  stroke-width: 1.4;
  stroke-linejoin: round;
}

.leaf .fold {
  fill: currentColor;
  opacity: 0.25;
}

.leaf .tint {
  transition: fill 200ms ease;
}

.name {
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.hint {
  color: var(--muted);
  font-size: 0.6875rem;
  font-variant-numeric: tabular-nums;
}

@media (max-width: 40rem) {
  .dock {
    position: fixed;
    inset-inline: 0;
    bottom: 0;
    z-index: 30;
    justify-content: center;
    padding: 0.5rem 0.75rem calc(0.5rem + env(safe-area-inset-bottom));
    border-top: 1px solid var(--line);
    background: var(--paper);
  }

  .sheet {
    flex: 1 1 0;
    max-width: 12rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .sheet,
  .leaf .tint {
    transition: none;
  }
}
</style>
