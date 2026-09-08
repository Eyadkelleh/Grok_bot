/**
 * Selected banner backdrop + event copy. Persisted like shape/colour.
 */

import { computed, ref } from 'vue'
import { ecris, lis } from './i18n/stockage'
import { isBannerId, type BannerId } from './ui/scene'

export interface BannerCopy {
  welcome: string
  event1: string
  event2: string
  presentedBy: string
}

const DEFAULT_COPY: BannerCopy = {
  welcome: 'Welcome',
  event1: '',
  event2: '',
  presentedBy: 'Presented by',
}

function lireBannerId(): BannerId | null {
  const raw = lis('fond')
  if (!raw || raw === 'aucun') return null
  return isBannerId(raw) ? raw : null
}

function lireCopy(): BannerCopy {
  try {
    const raw = lis('fondCopy')
    if (!raw) return { ...DEFAULT_COPY }
    const parsed = JSON.parse(raw) as Partial<BannerCopy>
    return {
      welcome: parsed.welcome?.trim() ? parsed.welcome : DEFAULT_COPY.welcome,
      event1: parsed.event1 ?? '',
      event2: parsed.event2 ?? '',
      presentedBy: parsed.presentedBy?.trim()
        ? parsed.presentedBy
        : DEFAULT_COPY.presentedBy,
    }
  } catch {
    return { ...DEFAULT_COPY }
  }
}

const plate = ref<BannerId | null>(lireBannerId())
const copy = ref<BannerCopy>(lireCopy())

export const bannerId = computed<BannerId | null>({
  get: () => plate.value,
  set: (valeur) => {
    plate.value = valeur
    ecris('fond', valeur ?? 'aucun')
  },
})

export const bannerCopy = computed<BannerCopy>({
  get: () => copy.value,
  set: (valeur) => {
    copy.value = { ...valeur }
    ecris('fondCopy', JSON.stringify(copy.value))
  },
})

export function setBannerCopy(partial: Partial<BannerCopy>) {
  bannerCopy.value = { ...copy.value, ...partial }
}

export function rechargerFond() {
  plate.value = lireBannerId()
  copy.value = lireCopy()
}
