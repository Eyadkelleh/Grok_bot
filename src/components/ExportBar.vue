<script setup lang="ts">
import { computed } from 'vue'
import { t, type Cle } from '../i18n'
import { ACTIONS, type ActionId, type EtatExport } from '../ui/export'

const props = defineProps<{ etat: EtatExport }>()
const emit = defineEmits<{ exporter: [ActionId] }>()

const occupe = computed(() => props.etat === 'occupe')

const statut = computed(() => {
  if (props.etat === 'exporte') return t('export.done')
  if (props.etat === 'erreur') return t('export.failed')
  return ''
})
</script>

<template>
  <section class="export surface" data-export-bar aria-labelledby="export-title">
    <h2 id="export-title">{{ t('export.title') }}</h2>
    <div class="actions">
      <button
        v-for="action in ACTIONS"
        :key="action.id"
        type="button"
        :data-export="action.id"
        :disabled="occupe"
        @click="emit('exporter', action.id)"
      >
        {{ t(`export.${action.id}` as Cle) }}
      </button>
    </div>
    <p v-if="statut" class="status" data-export-status role="status">{{ statut }}</p>
  </section>
</template>

<style scoped>
.export {
  max-width: var(--rail);
  text-align: left;
}

h2 {
  margin: 0 0 0.65rem;
  font-size: 0.875rem;
  font-weight: 600;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

button {
  flex: 1 1 7rem;
  padding: 0.55rem 0.75rem;
  border: 1px solid var(--line);
  border-radius: 0.75rem;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
}

button:hover,
button:focus-visible {
  border-color: var(--ink);
}

button:disabled {
  cursor: default;
  opacity: 0.6;
  filter: none;
}

.status {
  margin: 0.5rem 0 0;
  color: var(--muted);
  font-size: 0.75rem;
}
</style>
