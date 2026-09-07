<script setup lang="ts">
import { brand } from './brand'
import AvatarStub from './components/AvatarStub.vue'
</script>

<template>
  <main class="page">
    <AvatarStub :label="brand.name" />
    <h1>{{ brand.name }}</h1>
    <p>{{ brand.tagline }}</p>
  </main>
</template>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.25rem;
  padding: 2rem;
  text-align: center;
}

h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: -0.03em;
}

p {
  margin: 0;
  max-width: 28rem;
  color: #57534e;
  line-height: 1.5;
}
</style>
