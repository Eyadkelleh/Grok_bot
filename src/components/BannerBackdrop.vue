<script setup lang="ts">
import { computed } from 'vue'
import type { BannerCopy } from '../fond'
import { plateDe } from '../ui/plates'
import {
  BANNER_REF_H,
  BANNER_REF_W,
  CADRE_BANNER_PNG,
  mesureScene,
  sceneBanniere,
  type BannerId,
} from '../ui/scene'
import { styleSlot } from '../ui/toile'

const props = defineProps<{
  bannerId: BannerId
  copy: BannerCopy
}>()

const scene = computed(() =>
  sceneBanniere(props.bannerId, CADRE_BANNER_PNG, props.copy),
)
const plate = computed(() => plateDe(props.bannerId))
const slots = computed(() => mesureScene(scene.value))
const ink = computed(() => (plate.value.encre === 'clair' ? '#fff' : '#111'))

const welcomeStyle = computed(() =>
  styleSlot(slots.value.welcome, CADRE_BANNER_PNG.width, CADRE_BANNER_PNG.height),
)
const eventStyle = computed(() =>
  styleSlot(slots.value.event, CADRE_BANNER_PNG.width, CADRE_BANNER_PNG.height),
)
const presentedStyle = computed(() =>
  styleSlot(slots.value.presentedBy, CADRE_BANNER_PNG.width, CADRE_BANNER_PNG.height),
)
const wordmarkStyle = computed(() =>
  styleSlot(slots.value.wordmark, CADRE_BANNER_PNG.width, CADRE_BANNER_PNG.height),
)
const logoStyle = computed(() =>
  styleSlot(slots.value.logo, CADRE_BANNER_PNG.width, CADRE_BANNER_PNG.height),
)

const eventLines = computed(() =>
  [props.copy.event1, props.copy.event2].map((l) => l.trim()).filter(Boolean),
)
</script>

<template>
  <div
    class="banner-stage"
    data-banner-backdrop
    :data-banner="bannerId"
    :style="{ aspectRatio: `${BANNER_REF_W} / ${BANNER_REF_H}` }"
  >
    <div
      class="plate"
      :style="{
        background: plate.fondHex ?? '#000',
      }"
    >
      <img
        v-if="plate.photo"
        class="photo"
        :src="plate.photo"
        alt=""
      />
      <img
        v-for="(layer, i) in plate.decor"
        :key="i"
        class="decor"
        :src="layer.src"
        alt=""
        :style="{
          left: `${layer.left}%`,
          top: `${layer.top}%`,
          width: `${layer.width}%`,
          height: `${layer.height}%`,
          transform: layer.rotate ? `rotate(${layer.rotate}deg)` : undefined,
        }"
      />
    </div>

    <p
      v-if="copy.welcome.trim()"
      class="slot text"
      :style="{ ...welcomeStyle, color: ink }"
    >
      {{ copy.welcome }}
    </p>
    <div
      v-if="eventLines.length"
      class="slot text event"
      :style="{ ...eventStyle, color: ink }"
    >
      <p v-for="(line, i) in eventLines" :key="i">{{ line }}</p>
    </div>
    <p
      v-if="copy.presentedBy.trim()"
      class="slot text presented"
      :style="{ ...presentedStyle, color: ink }"
    >
      {{ copy.presentedBy }}
    </p>
    <img
      class="slot wordmark"
      :src="plate.spacex"
      alt=""
      :style="wordmarkStyle"
    />
    <!-- Logo slot is reserved for the live Avatar overlay in PhantomStudio -->
    <div class="slot logo-hole" aria-hidden="true" :style="logoStyle" />
  </div>
</template>

<style scoped>
.banner-stage {
  position: absolute;
  inset: 50% auto auto 50%;
  translate: -50% -50%;
  width: min(42%, 14rem);
  max-height: 92%;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}

.plate {
  position: absolute;
  inset: 0;
}

.photo {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 300%;
  height: auto;
  max-width: none;
  transform: translate(-50%, -50%) rotate(-90deg);
  object-fit: cover;
}

.decor {
  position: absolute;
  object-fit: contain;
  transform-origin: center center;
}

.slot {
  position: absolute;
  margin: 0;
  display: grid;
  place-items: center;
  text-align: center;
}

.text {
  font-weight: 400;
  line-height: 1.15;
  letter-spacing: -0.02em;
}

.welcome,
.slot.text:first-of-type {
  font-size: clamp(0.55rem, 2.2vw, 0.85rem);
}

.event {
  font-size: clamp(0.45rem, 1.8vw, 0.7rem);
  gap: 0.1em;
}

.event p {
  margin: 0;
}

.presented {
  font-size: clamp(0.35rem, 1.2vw, 0.5rem);
}

.wordmark {
  object-fit: contain;
  padding: 0 4%;
}

.logo-hole {
  /* PhantomStudio parks the Avatar over this region via CSS variable sync */
}
</style>
