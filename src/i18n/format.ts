export function interpoler(
  texte: string,
  valeurs?: Record<string, string | number>,
): string {
  if (!valeurs) return texte
  let sortie = texte
  for (const [nom, valeur] of Object.entries(valeurs)) {
    sortie = sortie.split(`{${nom}}`).join(String(valeur))
  }
  return sortie
}
