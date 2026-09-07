/**
 * Framing and naming for still and montage exports. Pure: no DOM, so it is
 * testable in Vitest like the rest of the studio logic. Rasterisation lives
 * in capture.ts; the MP4 encoder lives in video.ts and must stay a dynamic
 * import — a static one from this file would pull mediabunny into the entry chunk.
 */

import { viewBoxAttr } from '../engine'

/** One PNG size: 1024 covers Discord/X/GitHub/Slack avatars and downscales cleanly. */
export const PNG_TAILLE = 1024

/**
 * Intrinsic SVG size in CSS pixels. Matches the on-screen viewBox side so the
 * file opens 1:1 with the studio frame; it still scales because it is vector.
 */
export const SVG_TAILLE = 100

export type ActionId = 'png' | 'svg' | 'gif' | 'mp4'
export type ModeExport = 'telecharge' | 'montage'
export type EtatExport = 'pret' | 'occupe' | 'exporte' | 'erreur'
export type FormatCycle = 'mp4' | 'gif'
export type FondGif = 'blanc' | 'transparent'

export interface ActionExport {
  id: ActionId
  mode: ModeExport
  taille: number
  extension: 'png' | 'svg' | 'gif' | 'mp4'
}

/** Cycle formats. No animated SVG: the body path changes every frame. */
export const FORMATS_CYCLE: FormatCycle[] = ['mp4', 'gif']
export const FORMAT_CYCLE_DEFAUT: FormatCycle = 'mp4'

/**
 * Rate and size are per format. GIF is capped by file weight and hundredths-of-a-second
 * delays; video compresses motion, so 1024 at 30 fps stays cheap.
 */
export const CYCLE_FPS = { gif: 20, mp4: 30 } as const
export const CYCLE_TAILLE = { gif: 320, mp4: 1024 } as const

export const cyclePas = (format: FormatCycle) => 1 / CYCLE_FPS[format]

/** How many frames for a cycle of `duree` seconds. */
export const cycleImages = (duree: number, format: FormatCycle) =>
  Math.max(1, Math.round(duree * CYCLE_FPS[format]))

export const cycleAccepteTransparence = (format: FormatCycle) => format === 'gif'

export const FONDS_GIF: FondGif[] = ['blanc', 'transparent']
export const FOND_GIF_DEFAUT: FondGif = 'blanc'

/** Pure white, not site `--paper`: "white background" must be white. */
export const BLANC = '#ffffff'

/** Colour to paint under the ball, or `null` to leave the canvas clear. */
export const couleurDeFond = (fond: FondGif) => (fond === 'blanc' ? BLANC : null)

export const ACTIONS: ActionExport[] = [
  { id: 'png', mode: 'telecharge', taille: PNG_TAILLE, extension: 'png' },
  { id: 'svg', mode: 'telecharge', taille: SVG_TAILLE, extension: 'svg' },
  { id: 'gif', mode: 'montage', taille: CYCLE_TAILLE.gif, extension: 'gif' },
  { id: 'mp4', mode: 'montage', taille: CYCLE_TAILLE.mp4, extension: 'mp4' },
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

/**
 * Can this browser encode video?
 *
 * Lives here, not in video.ts: any static import of video.ts pulls mediabunny
 * into the entry chunk. video.ts only loads the library inside versMp4.
 */
export function videoPossible() {
  return typeof VideoEncoder !== 'undefined'
}

/** User cancelled the export. Callers treat this as success, not an error. */
export class Abandon extends Error {
  constructor() {
    super('export cancelled')
    this.name = 'Abandon'
  }
}

/** Throw if the user asked to cancel. */
export function arrete(signal: AbortSignal | undefined) {
  if (signal?.aborted) throw new Abandon()
}
