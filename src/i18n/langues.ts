export const LANGUES = [
  { id: 'en', tag: 'en', emoji: '🇬🇧', nom: 'English' },
  { id: 'fr', tag: 'fr', emoji: '🇫🇷', nom: 'Français' },
  { id: 'zh', tag: 'zh-Hans', emoji: '🇨🇳', nom: '简体中文' },
] as const

export type Langue = (typeof LANGUES)[number]['id']

export const LANGUE_PAR_DEFAUT: Langue = 'en'

export function estLangue(valeur: string | null | undefined): valeur is Langue {
  return LANGUES.some((l) => l.id === valeur)
}

export function tagDe(langue: Langue): string {
  return LANGUES.find((l) => l.id === langue)!.tag
}

export function choisirLangue(
  memorisee: string | null,
  preferences: readonly string[],
): Langue {
  if (estLangue(memorisee)) return memorisee
  for (const tag of preferences) {
    let base: string
    try {
      base = new Intl.Locale(tag).language
    } catch {
      continue
    }
    if (estLangue(base)) return base
  }
  return LANGUE_PAR_DEFAUT
}
