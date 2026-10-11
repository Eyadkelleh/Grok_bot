<script setup lang="ts">
import { computed, type WritableComputedRef } from 'vue'
import { t } from '../i18n'
import type { BannerCopy, ImageDesk, VideoDesk } from '../studio'
import type { BannerId } from '../ui/scene'
import FondPanel from './FondPanel.vue'

const props = defineProps<{
  desk: ImageDesk | VideoDesk
  bannerCopy: BannerCopy
}>()

const emit = defineEmits<{ 'banner-copy': [patch: Partial<BannerCopy>] }>()

const bannerId: WritableComputedRef<BannerId | null> = computed({
  get: () => props.desk.config.value.look.banner,
  set: (value) => props.desk.commit({ field: 'banner', value }),
})

const copy = computed({
  get: () => props.bannerCopy,
  set: (next: BannerCopy) => emit('banner-copy', next),
})
</script>

<template>
  <section id="rollup" class="rollup surface" data-rollup aria-labelledby="rollup-title">
    <h2 id="rollup-title">{{ t('rollup.title') }}</h2>
    <p class="lead">{{ t('rollup.lead') }}</p>
    <FondPanel v-model:banner-id="bannerId" v-model:copy="copy" />
  </section>
</template>

<style scoped>
.rollup {
  max-width: 28rem;
  text-align: left;
}

h2 {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
}

.lead {
  margin: 0.35rem 0 0.85rem;
  color: var(--muted);
  font-size: 0.8125rem;
  line-height: 1.45;
}

.rollup :deep([data-fond-panel]) {
  padding: 0;
  border: none;
  border-radius: 0;
  background: none;
}
</style>
