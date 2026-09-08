<script setup lang="ts">
import { computed } from 'vue'
import type { BannerCopy } from '../fond'
import { t, type Cle } from '../i18n'
import { PLATES } from '../ui/plates'
import { type BannerId } from '../ui/scene'

const bannerId = defineModel<BannerId | null>('bannerId', { required: true })
const copy = defineModel<BannerCopy>('copy', { required: true })

const choices = computed(() => [
  { id: null as BannerId | null, label: t('fond.none'), thumb: null },
  ...PLATES.map((p) => ({
    id: p.id as BannerId | null,
    label: t(p.labelKey as Cle),
    thumb: p.thumb,
  })),
])

function choisir(id: BannerId | null) {
  bannerId.value = id
}

function patch(field: keyof BannerCopy, value: string) {
  copy.value = { ...copy.value, [field]: value }
}
</script>

<template>
  <aside class="fond-panel surface" data-fond-panel aria-labelledby="fond-title">
    <h2 id="fond-title">{{ t('fond.title') }}</h2>
    <div class="tiles" role="radiogroup" :aria-label="t('fond.title')">
      <button
        v-for="c in choices"
        :key="c.id ?? 'aucun'"
        type="button"
        role="radio"
        :aria-checked="bannerId === c.id"
        :aria-label="c.label"
        :data-fond="c.id ?? 'aucun'"
        :class="{ selected: bannerId === c.id }"
        @click="choisir(c.id)"
      >
        <span v-if="!c.thumb" class="empty">{{ c.label }}</span>
        <img v-else :src="c.thumb" :alt="c.label" />
      </button>
    </div>

    <template v-if="bannerId">
      <label class="field">
        <span>{{ t('fond.welcome') }}</span>
        <input
          type="text"
          data-fond-welcome
          :value="copy.welcome"
          @input="patch('welcome', ($event.target as HTMLInputElement).value)"
        />
      </label>
      <label class="field">
        <span>{{ t('fond.event1') }}</span>
        <input
          type="text"
          data-fond-event1
          :value="copy.event1"
          :placeholder="t('fond.eventPlaceholder')"
          @input="patch('event1', ($event.target as HTMLInputElement).value)"
        />
      </label>
      <label class="field">
        <span>{{ t('fond.event2') }}</span>
        <input
          type="text"
          data-fond-event2
          :value="copy.event2"
          :placeholder="t('fond.eventPlaceholder')"
          @input="patch('event2', ($event.target as HTMLInputElement).value)"
        />
      </label>
    </template>
  </aside>
</template>

<style scoped>
.fond-panel {
  text-align: left;
  padding: 0.75rem;
}

h2 {
  margin: 0 0 0.65rem;
  font-size: 0.875rem;
  font-weight: 600;
}

.tiles {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.4rem;
}

button {
  aspect-ratio: 1 / 2.4;
  padding: 0;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 0.65rem;
  background: var(--paper);
  cursor: pointer;
}

button.selected {
  border-color: var(--ink);
  box-shadow: inset 0 0 0 1px var(--ink);
}

button img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.empty {
  display: grid;
  place-items: center;
  height: 100%;
  padding: 0.35rem;
  color: var(--muted);
  font-size: 0.7rem;
  line-height: 1.2;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-top: 0.65rem;
  font-size: 0.75rem;
  color: var(--muted);
}

.field input {
  padding: 0.45rem 0.55rem;
  border: 1px solid var(--line);
  border-radius: 0.5rem;
  background: transparent;
  color: var(--ink);
  font: inherit;
  font-size: 0.875rem;
}
</style>
