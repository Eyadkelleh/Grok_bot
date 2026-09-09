/**
 * Portrait banner stills and MP4. Square Discord exports stay on capture.ts.
 */

import { totalDuration, type Cycle } from '../engine'
import type { BannerCopy } from '../fond'
import {
  dessine,
  ouvreCycle,
  svgAutonome,
  telecharge,
  type Avancement,
  type ReglagesBot,
} from './capture'
import { CYCLE_FPS, arrete, nomFichier, viewBoxCycle } from './export'
import {
  CADRE_BANNER_MP4,
  CADRE_BANNER_PNG,
  sceneBanniere,
  type BannerId,
} from './scene'
import { peintScene } from './toile'

export type { BannerCopy }

async function sujetCarre(
  reglages: ReglagesBot,
  blocs: Cycle['blocks'],
  t: number,
  taille: number,
  paper: string,
): Promise<HTMLCanvasElement> {
  const lecteur = await ouvreCycle(reglages, blocs, taille, paper)
  try {
    const svg = await lecteur.rendre(t)
    const canvas = document.createElement('canvas')
    await dessine(svgAutonome(svg, taille, viewBoxCycle()), taille, canvas, null)
    return canvas
  } finally {
    lecteur.ferme()
  }
}

export async function exportBannerStill(
  plateId: BannerId,
  copy: BannerCopy,
  reglages: ReglagesBot,
  stateBlocks: Cycle['blocks'],
  nom: string,
): Promise<void> {
  const scene = sceneBanniere(plateId, CADRE_BANNER_PNG, copy)
  const { width, height } = scene.cadre
  const sujet = await sujetCarre(reglages, stateBlocks, 0, Math.round(width * 0.55), '#ffffff')
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas unavailable')
  await peintScene(ctx, scene, sujet, { opaque: true })
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('png failed'))), 'image/png')
  })
  telecharge(blob, nomFichier(`banner-${nom}`, 'png'))
}

export async function exportBannerMontage(
  plateId: BannerId,
  copy: BannerCopy,
  reglages: ReglagesBot,
  cycle: Cycle,
  nom: string,
  avance?: Avancement,
  signal?: AbortSignal,
): Promise<void> {
  const scene = sceneBanniere(plateId, CADRE_BANNER_MP4, copy)
  const { width, height } = scene.cadre
  const duree = totalDuration(cycle.blocks)
  const fps = CYCLE_FPS.mp4
  const images = Math.max(1, Math.round(duree * fps))
  const pas = 1 / fps
  const sujetTaille = Math.round(width * 0.55)
  const lecteur = await ouvreCycle(reglages, cycle.blocks, sujetTaille, '#ffffff')
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas unavailable')

  try {
    const { versMp4 } = await import('./video')
    const blob = await versMp4(
      canvas,
      images,
      fps,
      async (i) => {
        arrete(signal)
        const svg = await lecteur.rendre(i * pas)
        const sujet = document.createElement('canvas')
        await dessine(svgAutonome(svg, sujetTaille, viewBoxCycle()), sujetTaille, sujet, null)
        await peintScene(ctx, scene, sujet, { opaque: true })
      },
      avance,
      signal,
    )
    telecharge(blob, nomFichier(`banner-${nom}`, 'mp4'))
  } finally {
    lecteur.ferme()
  }
}
