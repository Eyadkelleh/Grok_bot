<script setup lang="ts">
import { ref } from 'vue'
import { t } from './i18n'
import { REST_GAZE, type AnimationState } from './engine'
import Avatar from './components/Avatar.vue'
import AnimationsPalette from './components/AnimationsPalette.vue'
import Settings from './components/Settings.vue'
import Timeline from './components/Timeline.vue'

const animationState = ref<AnimationState>('Idle')
const playing = ref(false)
</script>

<template>
  <div class="shell">
    <header class="topbar">
      <p class="brand">{{ t('app.name') }}</p>
      <nav class="nav" :aria-label="t('nav.label')">
        <a href="#studio" data-nav="studio">{{ t('nav.studio') }}</a>
        <a href="#settings" data-nav="settings">{{ t('nav.settings') }}</a>
        <a href="#about" data-nav="about">{{ t('nav.about') }}</a>
      </nav>
    </header>

    <main class="page">
      <div class="workspace">
        <section id="studio" class="studio">
          <Avatar
            :state="animationState"
            :size="220"
            shape="circle"
            expression="neutral"
            :gaze="REST_GAZE"
            colour="ink"
            :label="t('app.botAria')"
          />
          <h1>{{ t('app.name') }}</h1>
          <p class="tagline">{{ t('app.tagline') }}</p>
        </section>
        <AnimationsPalette v-model="animationState" @update:modelValue="playing = false" />
      </div>
      <Settings />
    </main>
    <Timeline v-model:state="animationState" v-model:playing="playing" />
  </div>
</template>

<style scoped>
.shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.topbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem 1.25rem;
  padding: 1rem 1.5rem;
}

.brand {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 600;
  letter-spacing: -0.03em;
}

.nav {
  display: flex;
  gap: 0.75rem;
}

.nav a {
  color: var(--muted);
  font-size: 0.875rem;
  text-decoration: none;
}

.nav a:hover,
.nav a:focus-visible {
  color: var(--ink);
}

.page {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2.5rem;
  padding: 2rem 1.5rem 14rem;
}

.workspace {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: center;
  gap: 2rem 2.5rem;
  width: 100%;
  max-width: 48rem;
}

.studio {
  display: flex;
  flex: 1 1 16rem;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
  text-align: center;
}

h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: -0.03em;
}

.tagline {
  margin: 0;
  max-width: 28rem;
  color: var(--muted);
  line-height: 1.5;
}
</style>
