const PREFIXE = 'grok_bot:'

const NOMS = ['langue', 'forme', 'couleur', 'expression'] as const

export type NomStocke = (typeof NOMS)[number]

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
