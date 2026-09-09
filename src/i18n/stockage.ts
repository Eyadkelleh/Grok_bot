const PREFIXE = 'grok_bot:'

const NOMS = ['langue', 'studio', 'forme', 'couleur', 'expression', 'cycles', 'fond', 'fondCopy'] as const

/** Pre-`studio` keys. Readable so `migrateLegacy` can upgrade them. */
const LEGACY_NOMS = ['forme', 'couleur', 'expression', 'cycles', 'fond', 'fondCopy'] as const

export type NomStocke = (typeof NOMS)[number]
export type NomLegacy = (typeof LEGACY_NOMS)[number]

export const NOMS_LEGACY: readonly NomLegacy[] = LEGACY_NOMS

export function cle(nom: NomStocke): string {
  return `${PREFIXE}${nom}`
}

export function lis(nom: NomStocke): string | null {
  try {
    return window.localStorage.getItem(cle(nom))
  } catch {
    return null
  }
}

export function ecris(nom: NomStocke, valeur: string) {
  try {
    window.localStorage.setItem(cle(nom), valeur)
  } catch {
    // quota or access denied: keep the session, drop persistence
  }
}

export function efface(nom: NomStocke) {
  try {
    window.localStorage.removeItem(cle(nom))
  } catch {
    // same as ecris: persistence is best-effort
  }
}
