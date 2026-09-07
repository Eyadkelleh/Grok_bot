<script setup lang="ts">
import { computed } from 'vue'
import { brand } from '../brand'
import { langue, LANGUES, t } from '../i18n'

const credits = computed(() => {
  const [avant = '', apres = ''] = t('settings.credits').split('{name}')
  return { avant, apres }
})

function auClavier(event: KeyboardEvent, index: number) {
  const pas = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key]
  if (!pas) return
  event.preventDefault()
  const cible = LANGUES[(index + pas + LANGUES.length) % LANGUES.length]!
  langue.value = cible.id
  const boutons = (event.currentTarget as HTMLElement).parentElement?.children
  const suivant = boutons?.[LANGUES.indexOf(cible)]
  if (suivant instanceof HTMLElement) suivant.focus()
}
</script>

<template>
  <section id="settings" class="settings surface" aria-labelledby="settings-title">
    <h2 id="settings-title">{{ t('settings.title') }}</h2>

    <h3>{{ t('settings.language') }}</h3>
    <div class="langs" role="radiogroup" :aria-label="t('settings.language')">
      <button
        v-for="(l, i) in LANGUES"
        :key="l.id"
        type="button"
        role="radio"
        :aria-checked="l.id === langue"
        :aria-label="l.nom"
        :lang="l.tag"
        :data-locale="l.id"
        :tabindex="l.id === langue ? 0 : -1"
        :class="{ selected: l.id === langue }"
        @keydown="auClavier($event, i)"
        @click="langue = l.id"
      >
        <span class="flag" aria-hidden="true">{{ l.emoji }}</span>
        <span class="nom">{{ l.nom }}</span>
        <svg
          v-if="l.id === langue"
          width="12"
          height="12"
          viewBox="0 0 12 12"
          aria-hidden="true"
          class="check"
        >
          <path
            d="M2.5 6.4 4.8 8.7 9.5 3.6"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </div>

    <h3 id="about">{{ t('settings.about') }}</h3>
    <a
      class="link"
      :href="brand.github"
      target="_blank"
      rel="noopener noreferrer"
      :aria-label="t('settings.githubAria')"
    >
      <span>{{ t('settings.github') }}</span>
    </a>
    <p class="credits" data-credits>
      {{ credits.avant
      }}<a
        :href="brand.bloub"
        target="_blank"
        rel="noopener noreferrer"
        :aria-label="t('settings.creditsAria')"
        >bloub</a
      >{{ credits.apres }}
    </p>
    <p class="disclaimer" data-disclaimer>{{ t('settings.disclaimer') }}</p>
  </section>
</template>

<style scoped>
.settings {
  max-width: 22rem;
  text-align: left;
}

h2,
h3 {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
}

h3 {
  margin-top: 1.25rem;
}

.langs {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-top: 0.5rem;
}

.langs button {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.55rem 0.75rem;
  border: 1px solid var(--line);
  border-radius: 0.75rem;
  background: transparent;
  color: var(--muted);
  font: inherit;
  font-size: 0.875rem;
  text-align: left;
  cursor: pointer;
}

.langs button.selected {
  border-color: var(--ink);
  background: var(--paper);
  color: var(--ink);
  font-weight: 500;
}

.flag {
  font-size: 1rem;
  line-height: 1;
}

.nom {
  flex: 1;
}

.check {
  flex-shrink: 0;
}

.link {
  display: flex;
  margin-top: 0.5rem;
  padding: 0.55rem 0.75rem;
  border: 1px solid var(--line);
  border-radius: 0.75rem;
  color: inherit;
  font-size: 0.875rem;
  text-decoration: none;
}

.link:hover,
.langs button:hover {
  border-color: var(--muted);
}

.credits,
.disclaimer {
  margin: 0.75rem 0 0;
  color: var(--muted);
  font-size: 0.75rem;
  line-height: 1.5;
}

.credits a {
  color: var(--ink);
  font-weight: 500;
}
</style>
