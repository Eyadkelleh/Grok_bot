<script setup lang="ts">
defineProps<{
  label: string
}>()
</script>

<template>
  <svg class="avatar" viewBox="0 0 100 100" role="img" :aria-label="label">
    <circle cx="50" cy="50" r="46" fill="#111111" />
  </svg>
</template>

<style scoped>
.avatar {
  display: block;
  width: 220px;
  height: 220px;
}
</style>
