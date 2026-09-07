import { computed, ref } from 'vue'
import {
  DEFAULT_COLOR,
  DEFAULT_EXPRESSION,
  DEFAULT_SHAPE,
  isColorId,
  isExpressionId,
  isShapeId,
  type ColorId,
  type ExpressionId,
  type ShapeId,
} from './engine'
import { ecris, lis, type NomStocke } from './i18n/stockage'

function restaurer<T extends string>(
  nom: NomStocke,
  estValide: (valeur: string) => valeur is T,
  defaut: T,
): T {
  const stocke = lis(nom)
  return stocke && estValide(stocke) ? stocke : defaut
}

const forme = ref<ShapeId>(restaurer('forme', isShapeId, DEFAULT_SHAPE))
const teinte = ref<ColorId>(restaurer('couleur', isColorId, DEFAULT_COLOR))
const visage = ref<ExpressionId>(restaurer('expression', isExpressionId, DEFAULT_EXPRESSION))

export const shape = computed<ShapeId>({
  get: () => forme.value,
  set: (valeur) => {
    if (!isShapeId(valeur)) return
    forme.value = valeur
    ecris('forme', valeur)
  },
})

export const colour = computed<ColorId>({
  get: () => teinte.value,
  set: (valeur) => {
    if (!isColorId(valeur)) return
    teinte.value = valeur
    ecris('couleur', valeur)
  },
})

export const expression = computed<ExpressionId>({
  get: () => visage.value,
  set: (valeur) => {
    if (!isExpressionId(valeur)) return
    visage.value = valeur
    ecris('expression', valeur)
  },
})

export function rechargerApparence() {
  forme.value = restaurer('forme', isShapeId, DEFAULT_SHAPE)
  teinte.value = restaurer('couleur', isColorId, DEFAULT_COLOR)
  visage.value = restaurer('expression', isExpressionId, DEFAULT_EXPRESSION)
}
