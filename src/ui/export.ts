/**
 * Framing and naming for still exports. Pure: no DOM, so it is testable in
 * Vitest like the rest of the studio logic. Rasterisation lives in capture.ts.
 */

import { viewBoxAttr } from '../engine'

/** One PNG size: 1024 covers Discord/X/GitHub/Slack avatars and downscales cleanly. */
export const PNG_TAILLE = 1024

/**
 * Intrinsic SVG size in CSS pixels. Matches the on-screen viewBox side so the
 * file opens 1:1 with the studio frame; it still scales because it is vector.
 */
export const SVG_TAILLE = 100

export type ActionId = 'png' | 'svg'
export type ModeExport = 'telecharge'
export type EtatExport = 'pret' | 'occupe' | 'exporte' | 'erreur'

export interface ActionExport {
  id: ActionId
  mode: ModeExport
  taille: number
  extension: 'png' | 'svg'
}

/**
 * Still catalogue only. GIF and MP4 belong to a later unit; a 1-bit GIF still
 * would stair-step the silhouette where PNG has 8-bit alpha.
 */
export const ACTIONS: ActionExport[] = [
  { id: 'png', mode: 'telecharge', taille: PNG_TAILLE, extension: 'png' },
  { id: 'svg', mode: 'telecharge', taille: SVG_TAILLE, extension: 'svg' },
]

export const ACTION_BY_ID = new Map<string, ActionExport>(ACTIONS.map((a) => [a.id, a]))

export const ACTION_DEFAUT: ActionId = 'png'

export function viewBoxExport(): string {
  return viewBoxAttr()
}

export function sansCommentaires(markup: string): string {
  return markup.replace(/<!--[\s\S]*?-->/g, '')
}

/**
 * `grok-bot-thinking.png`. Built from the state id, not the translated label,
 * so the filename does not change with the UI language.
 */
export function nomFichier(etat: string, extension: string): string {
  const propre = etat
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
  return propre ? `grok-bot-${propre}.${extension}` : `grok-bot.${extension}`
}
