/**
 * DOM layer of export: serialise the live SVG, rasterise stills, replay the
 * montage off-screen for GIF/MP4. Framing and naming live in export.ts.
 *
 * Stills serialise the on-screen node. The montage is a different problem: the
 * on-screen bot is at an arbitrary clock date, so cycle export drives a second
 * Avatar instance with rendAt(t) — the same component, dated, no rAF.
 *
 * video.ts is loaded only inside cycleVersMp4. A static import would pull
 * mediabunny into the entry chunk.
 */

import { createApp, h, nextTick, ref } from 'vue'
import Avatar from '../components/Avatar.vue'
import { DEFAULT_MORPH_MS, totalDuration, type Block, type Cycle } from '../engine'
import { gifIndexe, indexe, nouvellePalette, recense } from './gif'
import {
  ACTION_BY_ID,
  BLANC,
  CYCLE_TAILLE,
  FOND_GIF_DEFAUT,
  arrete,
  couleurDeFond,
  cycleImages,
  cyclePas,
  nomFichier,
  sansCommentaires,
  viewBoxExport,
  type ActionId,
  type FormatCycle,
} from './export'

function stripPresentation(el: Element) {
  for (const attr of [...el.attributes]) {
    if (attr.name === 'class' || attr.name.startsWith('data-')) {
      el.removeAttribute(attr.name)
    }
  }
  for (const child of el.children) stripPresentation(child)
}

/** Stable mask id so the file is not tied to a Vue instance. */
function recrireMasque(svg: SVGSVGElement) {
  const mask = svg.querySelector('mask')
  if (!mask) return
  const ancien = mask.getAttribute('id')
  mask.setAttribute('id', 'grok-bot-mask')
  if (!ancien) return
  for (const el of svg.querySelectorAll('[mask]')) {
    const valeur = el.getAttribute('mask')
    if (valeur?.includes(ancien)) el.setAttribute('mask', 'url(#grok-bot-mask)')
  }
}

/**
 * Serialise the displayed SVG into a standalone document.
 *
 * `width`/`height` are set explicitly: without an intrinsic size, Firefox
 * refuses to rasterise an SVG loaded into an `<img>` and the canvas comes out empty.
 */
export function svgAutonome(svg: SVGSVGElement, taille: number, viewBox = viewBoxExport()): string {
  const clone = svg.cloneNode(true) as SVGSVGElement
  stripPresentation(clone)
  recrireMasque(clone)
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('viewBox', viewBox)
  clone.setAttribute('width', String(taille))
  clone.setAttribute('height', String(taille))
  return sansCommentaires(new XMLSerializer().serializeToString(clone))
}

async function dessine(
  markup: string,
  taille: number,
  canvas: HTMLCanvasElement,
  fond: string | null = null,
) {
  const url = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml' }))
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    canvas.width = taille
    canvas.height = taille
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('canvas unavailable')
    ctx.clearRect(0, 0, taille, taille)
    if (fond) {
      ctx.fillStyle = fond
      ctx.fillRect(0, 0, taille, taille)
    }
    ctx.drawImage(img, 0, 0, taille, taille)
    return ctx
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** Rasterise an SVG to a lossless PNG. */
export async function versPng(markup: string, taille: number): Promise<Blob> {
  const canvas = document.createElement('canvas')
  await dessine(markup, taille, canvas)
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('png encoding failed'))),
      'image/png',
    )
  })
}

/** Trigger a download of a blob under the given filename. */
export function telecharge(blob: Blob, nom: string) {
  const url = URL.createObjectURL(blob)
  try {
    const a = document.createElement('a')
    a.href = url
    a.download = nom
    a.click()
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
  }
}

/** Serialise the live SVG and download it as SVG or PNG. */
export async function exporte(svg: SVGSVGElement, id: ActionId, etat: string) {
  const action = ACTION_BY_ID.get(id)
  if (!action || action.mode !== 'telecharge') throw new Error(`unknown export ${id}`)
  const markup = svgAutonome(svg, action.taille)
  const blob =
    action.extension === 'svg'
      ? new Blob([markup], { type: 'image/svg+xml' })
      : await versPng(markup, action.taille)
  telecharge(blob, nomFichier(etat, action.extension))
}

export type Avancement = (fait: number, total: number) => void

/** What the off-screen bot should wear. */
export interface ReglagesBot {
  shape: string
  colour: string
  expression: string
}

export interface LecteurHorsEcran {
  rendre: (t: number) => Promise<SVGSVGElement>
  ferme: () => void
}

/**
 * Replay a cycle off-screen, frame by frame.
 *
 * Not a capture of the displayed avatar: that bot is at an arbitrary clock date.
 * rendAt dates each state change at its absolute offset, so joints morph the
 * same way as live playback. The first frame is the first block, settled —
 * without that the model would morph in from Idle.
 */
export async function ouvreCycle(
  reglages: ReglagesBot,
  blocs: Block[],
  taille: number,
  paper?: string,
): Promise<LecteurHorsEcran> {
  const hote = document.createElement('div')
  hote.style.cssText = 'position:fixed;left:-99999px;top:0;width:0;height:0;overflow:hidden'
  document.body.appendChild(hote)

  const bot = ref<{ rendAt: (t: number, blocks: Block[]) => void } | null>(null)
  const app = createApp({
    render: () =>
      h(Avatar, {
        size: taille,
        shape: reglages.shape,
        expression: reglages.expression,
        colour: reglages.colour,
        state: blocs[0]?.state ?? 'Idle',
        durationMs: DEFAULT_MORPH_MS,
        ...(paper ? { paper } : {}),
        ref: bot,
      }),
  })
  app.mount(hote)
  await nextTick()

  const svg = hote.querySelector('svg')
  if (!(svg instanceof SVGSVGElement) || !bot.value) {
    app.unmount()
    hote.remove()
    throw new Error('off-screen bot did not render')
  }

  return {
    rendre: async (t: number) => {
      bot.value!.rendAt(t, blocs)
      await nextTick()
      return svg
    },
    ferme: () => {
      app.unmount()
      hote.remove()
    },
  }
}

/**
 * Export the cycle as MP4.
 *
 * Background is required: video has no alpha. Without a fill the bot would
 * composite onto black.
 */
export async function cycleVersMp4(
  reglages: ReglagesBot,
  blocs: Block[],
  taille: number,
  images: number,
  pas: number,
  fond: string,
  avance?: Avancement,
  signal?: AbortSignal,
): Promise<Blob> {
  const { versMp4 } = await import('./video')
  const canvas = document.createElement('canvas')
  const lecteur = await ouvreCycle(reglages, blocs, taille, fond)
  try {
    return await versMp4(
      canvas,
      images,
      Math.round(1 / pas),
      async (i) => {
        const svg = await lecteur.rendre(i * pas)
        await dessine(svgAutonome(svg, taille), taille, canvas, fond)
      },
      avance,
      signal,
    )
  } finally {
    lecteur.ferme()
  }
}

/**
 * Export the cycle as GIF.
 *
 * Two passes: a GIF needs a shared palette, so every frame must be seen before
 * any is encoded. Keeping raw pixels would cost 255 MB on a 30 s cycle. The
 * render is deterministic, so replaying the sequence yields the same images.
 */
export async function cycleVersGif(
  reglages: ReglagesBot,
  blocs: Block[],
  taille: number,
  images: number,
  pas: number,
  fond: string | null,
  avance?: Avancement,
  signal?: AbortSignal,
): Promise<Blob> {
  const canvas = document.createElement('canvas')
  const lecteur = await ouvreCycle(reglages, blocs, taille, fond ?? undefined)

  const passe = async (lis: (index: number, pixels: Uint8ClampedArray) => void) => {
    for (let i = 0; i < images; i++) {
      arrete(signal)
      const svg = await lecteur.rendre(i * pas)
      const ctx = await dessine(svgAutonome(svg, taille), taille, canvas, fond)
      lis(i, ctx.getImageData(0, 0, taille, taille).data)
    }
  }

  try {
    const palette = nouvellePalette()
    await passe((i, pixels) => {
      recense(palette, pixels)
      avance?.(i + 1, images * 2)
    })

    const morceaux: Uint8Array[] = []
    await passe((i, pixels) => {
      morceaux.push(indexe(palette, pixels))
      avance?.(images + i + 1, images * 2)
    })

    return new Blob([gifIndexe(palette, morceaux, taille, taille, Math.round(pas * 1000))], {
      type: 'image/gif',
    })
  } finally {
    lecteur.ferme()
  }
}

/** Download the active montage as GIF or MP4. */
export async function exporteMontage(
  format: FormatCycle,
  cycle: Cycle,
  reglages: ReglagesBot,
  nom: string,
) {
  const duree = totalDuration(cycle.blocks)
  const images = cycleImages(duree, format)
  const pas = cyclePas(format)
  const taille = CYCLE_TAILLE[format]
  const blob =
    format === 'mp4'
      ? await cycleVersMp4(reglages, cycle.blocks, taille, images, pas, BLANC)
      : await cycleVersGif(
          reglages,
          cycle.blocks,
          taille,
          images,
          pas,
          couleurDeFond(FOND_GIF_DEFAUT),
        )
  telecharge(blob, nomFichier(nom, format))
}
