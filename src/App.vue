<script setup lang="ts">
import { t } from './i18n'
import AvatarStub from './components/AvatarStub.vue'
import Settings from './components/Settings.vue'
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
      <section id="studio" class="studio">
        <AvatarStub :label="t('app.botAria')" />
        <h1>{{ t('app.name') }}</h1>
        <p class="tagline">{{ t('app.tagline') }}</p>
      </section>
      <Settings />
    </main>
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
  padding: 2rem 1.5rem 3rem;
  text-align: center;
}

.studio {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
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
