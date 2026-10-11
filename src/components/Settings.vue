<script setup lang="ts">
import { computed, nextTick } from 'vue'
import { brand } from '../brand'
import { langue, LANGUES, t, type Cle, type Langue } from '../i18n'
import { THEME_CHOICES, useStudio, type ThemeChoice } from '../studio'

const THEME_WELLS = [
  {
    id: 'light',
    labelKey: 'settings.themeLight',
    hintKey: 'settings.themeLightHint',
    sample: 'paper',
  },
  {
    id: 'dark',
    labelKey: 'settings.themeDark',
    hintKey: 'settings.themeDarkHint',
    sample: 'charcoal',
  },
  {
    id: 'system',
    labelKey: 'settings.themeSystem',
    hintKey: 'settings.themeSystemHint',
    sample: 'split',
  },
] as const satisfies readonly {
  id: ThemeChoice
  labelKey: Cle
  hintKey: Cle
  sample: 'paper' | 'charcoal' | 'split'
}[]

const { theme } = useStudio()

const anglais = LANGUES.find((l) => l.id === 'en')!

const tete = computed(() => {
  const promu = LANGUES.find((l) => l.id === langue.value && l.id !== 'en')
  return promu ? [anglais, promu] : [anglais]
})

const niches = computed(() =>
  LANGUES.filter((l) => l.id !== 'en' && l.id !== langue.value),
)

const credits = computed(() => {
  const [avant = '', apres = ''] = t('settings.credits').split('{name}')
  return { avant, apres }
})

function auClavierRadio<T extends string>(
  event: KeyboardEvent,
  ids: readonly T[],
  actuel: T,
  choisir: (id: T) => void,
  selecteur: (id: T) => string,
) {
  const pas = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key]
  if (!pas) return
  event.preventDefault()
  const index = ids.indexOf(actuel)
  const cible = ids[(index + pas + ids.length) % ids.length]!
  const groupe = (event.currentTarget as HTMLElement).closest('[role="radiogroup"]')
  choisir(cible)
  void nextTick(() => {
    const suivant = groupe?.querySelector(selecteur(cible))
    if (suivant instanceof HTMLElement) suivant.focus()
  })
}

function auClavierTheme(event: KeyboardEvent, id: ThemeChoice) {
  auClavierRadio(event, THEME_CHOICES, id, theme.choose, (cible) => `[data-theme-choice="${cible}"]`)
}

function auClavierLangue(event: KeyboardEvent, id: Langue) {
  auClavierRadio(
    event,
    LANGUES.map((l) => l.id),
    id,
    (cible) => {
      langue.value = cible
    },
    (cible) => `[data-locale="${cible}"]`,
  )
}
</script>

<template>
  <section id="settings" class="settings surface" aria-labelledby="settings-title">
    <h2 id="settings-title">{{ t('settings.title') }}</h2>

    <h3>{{ t('settings.theme') }}</h3>
    <div class="themes" role="radiogroup" :aria-label="t('settings.theme')">
      <button
        v-for="choice in THEME_WELLS"
        :key="choice.id"
        type="button"
        role="radio"
        :aria-checked="choice.id === theme.choice.value"
        :aria-describedby="`theme-hint-${choice.id}`"
        :data-theme-choice="choice.id"
        :tabindex="choice.id === theme.choice.value ? 0 : -1"
        :class="['well', { selected: choice.id === theme.choice.value }]"
        @keydown="auClavierTheme($event, choice.id)"
        @click="theme.choose(choice.id)"
      >
        <span class="swatch" :data-sample="choice.sample" aria-hidden="true">
          <span class="sample" :class="choice.sample">
            <svg
              v-if="choice.sample === 'split'"
              class="glyph"
              width="12"
              height="12"
              viewBox="0 0 12 12"
            >
              <circle cx="6" cy="6" r="4.2" fill="none" stroke="currentColor" stroke-width="1.2" />
              <path d="M6 1.8v8.4" fill="none" stroke="currentColor" stroke-width="1.2" />
            </svg>
          </span>
        </span>
        <span class="label">{{ t(choice.labelKey) }}</span>
        <span :id="`theme-hint-${choice.id}`" class="hint">{{ t(choice.hintKey) }}</span>
      </button>
    </div>

    <h3>{{ t('settings.language') }}</h3>
    <div class="langs" role="radiogroup" :aria-label="t('settings.language')">
      <div class="lead" data-lang-lead>
        <button
          v-for="l in tete"
          :key="l.id"
          type="button"
          role="radio"
          :aria-checked="l.id === langue"
          :aria-label="l.nom"
          :lang="l.tag"
          :data-locale="l.id"
          :tabindex="l.id === langue ? 0 : -1"
          :class="{ selected: l.id === langue }"
          @keydown="auClavierLangue($event, l.id)"
          @click="langue = l.id"
        >
          <span class="flag" aria-hidden="true">{{ l.emoji }}</span>
          <span class="copy">
            <span class="nom">{{ l.nom }}</span>
            <span v-if="l.id === 'en'" class="lead-hint">{{ t('settings.languageDefault') }}</span>
          </span>
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
      <details class="others">
        <summary>{{ t('settings.otherLanguages') }}</summary>
        <div class="nested" data-lang-others>
          <button
            v-for="l in niches"
            :key="l.id"
            type="button"
            role="radio"
            :aria-checked="l.id === langue"
            :aria-label="l.nom"
            :lang="l.tag"
            :data-locale="l.id"
            :tabindex="l.id === langue ? 0 : -1"
            :class="{ selected: l.id === langue }"
            @keydown="auClavierLangue($event, l.id)"
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
      </details>
    </div>

    <h3 id="about">{{ t('settings.about') }}</h3>
    <a
      class="github"
      data-github
      :href="brand.github"
      target="_blank"
      rel="noopener noreferrer"
      :aria-label="t('settings.githubAria')"
    >
      <svg class="mark" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
        <path
          fill="currentColor"
          d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8"
        />
      </svg>
      <span>{{ t('settings.github') }}</span>
      <svg class="external" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
        <path
          d="M4 2.5H2.5A1.5 1.5 0 0 0 1 4v5.5A1.5 1.5 0 0 0 2.5 11H8a1.5 1.5 0 0 0 1.5-1.5V8"
          fill="none"
          stroke="currentColor"
          stroke-width="1.2"
        />
        <path
          d="M6.5 1.2H11v4.5M10.7 1.3 5.4 6.8"
          fill="none"
          stroke="currentColor"
          stroke-width="1.2"
          stroke-linecap="round"
        />
      </svg>
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

.themes {
  display: flex;
  gap: 0.45rem;
  margin-top: 0.5rem;
}

.well {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.28rem;
  padding: 0.5rem 0.3rem 0.55rem;
  border: 1px solid var(--line);
  border-radius: 0.85rem;
  background: transparent;
  color: var(--muted);
  font: inherit;
  font-size: 0.75rem;
  cursor: pointer;
}

.well[data-theme-choice='light'] {
  background: #f4efe8;
}

.well[data-theme-choice='dark'] {
  background: #1c1815;
  color: #c4bbb4;
}

.well[data-theme-choice='system'] {
  background: linear-gradient(90deg, #f4efe8 50%, #1c1815 50%);
  color: var(--ink);
}

.well[data-theme-choice='system'] .label,
.well[data-theme-choice='system'] .hint {
  padding: 0 0.28rem;
  border-radius: 0.25rem;
  background: color-mix(in srgb, var(--paper) 86%, transparent);
}

.well.selected {
  background: var(--accent-soft);
  border-color: color-mix(in srgb, var(--accent-display) 48%, var(--line));
  color: var(--ink);
  font-weight: 500;
}

.well[data-theme-choice='dark'].selected {
  color: #f5f5f4;
}

.swatch {
  position: relative;
  display: grid;
  place-items: center;
}

.sample {
  display: grid;
  place-items: center;
  width: 1.7rem;
  height: 1.25rem;
  border-radius: 0.28rem;
  border: 1px solid rgb(var(--wash) / 0.14);
  transition: transform 0.12s ease;
}

.sample.paper {
  background: #ffffff;
}

.sample.charcoal {
  background: #2a2420;
}

.sample.split {
  background: linear-gradient(90deg, #ffffff 50%, #2a2420 50%);
  color: #57534e;
}

.well:hover .sample {
  transform: translateY(-1px);
}

.well.selected .swatch::after {
  content: '';
  position: absolute;
  top: -0.15rem;
  right: -0.15rem;
  width: 0.38rem;
  height: 0.38rem;
  border-radius: 99px;
  background: var(--accent-display);
  box-shadow: 0 0 8px var(--accent-glow);
}

.hint {
  font-size: 0.625rem;
  line-height: 1.2;
  opacity: 0.78;
}

.langs {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-top: 0.5rem;
}

.lead,
.nested {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
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

.copy {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.35rem;
}

.lead-hint {
  color: var(--muted);
  font-size: 0.7rem;
  font-weight: 400;
}

.lead-hint::before {
  content: '· ';
}

.check {
  flex-shrink: 0;
}

.others {
  border-radius: 0.75rem;
}

.others summary {
  cursor: pointer;
  color: var(--muted);
  font-size: 0.8125rem;
  padding: 0.35rem 0.15rem;
}

.nested {
  margin-top: 0.35rem;
}

.github {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin-top: 0.5rem;
  padding: 0.55rem 0.75rem 0.55rem 0.9rem;
  border: 1px solid var(--line);
  border-radius: 0.75rem;
  color: inherit;
  font-size: 0.875rem;
  text-decoration: none;
  background: transparent;
  box-shadow: inset 3px 0 0 var(--accent-display);
}

.github span {
  flex: 1;
}

.github .mark,
.github .external {
  flex-shrink: 0;
  color: var(--muted);
}

.github:hover,
.langs button:hover,
.well:hover {
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

@media (prefers-reduced-motion: reduce) {
  .sample {
    transition: none;
  }

  .well:hover .sample {
    transform: none;
  }

  .well.selected .swatch::after {
    box-shadow: none;
  }
}
</style>
