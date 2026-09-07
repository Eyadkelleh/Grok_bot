import { computed, ref, watchEffect } from 'vue'
import { interpoler } from './format'
import { choisirLangue, estLangue, type Langue, tagDe } from './langues'
import fr from './locales/fr'
import en from './locales/en'
import zh from './locales/zh'
import { ecris, lis } from './stockage'

export { LANGUES, type Langue } from './langues'
export { cle } from './stockage'

const dictionnaires: Record<Langue, typeof fr> = { fr, en, zh }

type Chemins<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Chemins<T[K], `${P}${K}.`>
}[keyof T & string]

export type Cle = Chemins<typeof fr>

const courante = ref<Langue>(
  choisirLangue(lis('langue'), navigator.languages ?? [navigator.language]),
)

export const langue = computed<Langue>({
  get: () => courante.value,
  set: (valeur) => {
    if (!estLangue(valeur)) return
    courante.value = valeur
    ecris('langue', valeur)
  },
})

const dictionnaire = computed(() => dictionnaires[courante.value])

const tag = computed(() => tagDe(courante.value))

watchEffect(() => {
  document.documentElement.lang = tag.value
  document.title = t('app.title')
})

function brut(cle: Cle): string {
  const noeud = cle
    .split('.')
    .reduce<unknown>((n, k) => (n as Record<string, unknown>)[k], dictionnaire.value)
  return noeud as string
}

export function t(cle: Cle, valeurs?: Record<string, string | number>): string {
  return interpoler(brut(cle), valeurs)
}

export function formaterNombre(n: number): string {
  const rounded = Math.round(n * 10) / 10
  const s = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
  return courante.value === 'fr' ? s.replace('.', ',') : s
}

export function secondes(n: number): string {
  return t('units.seconds', { n: formaterNombre(n) })
}

export function secondesCourtes(n: number): string {
  return t('units.secondsShort', { n: formaterNombre(n) })
}

export function nomDeCycle(cycle: { name: string }): string {
  return cycle.name.trim() || t('cycles.defaultName')
}

export function rechargerLangue(): Langue {
  courante.value = choisirLangue(lis('langue'), navigator.languages ?? [navigator.language])
  return courante.value
}
