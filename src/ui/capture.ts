/**
 * DOM layer of still export: serialise the live SVG, rasterise to PNG, download.
 * Framing and naming live in export.ts so they stay testable without a canvas.
 *
 * The exported drawing is the on-screen node, cropped only by width/height.
 * Rebuilding a second render beside it would drift from what the user sees.
 */

import {
  ACTION_BY_ID,
  nomFichier,
  sansCommentaires,
  viewBoxExport,
  type ActionId,
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

async function dessine(markup: string, taille: number, canvas: HTMLCanvasElement) {
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
  if (!action) throw new Error(`unknown export ${id}`)
  const markup = svgAutonome(svg, action.taille)
  const blob =
    action.extension === 'svg'
      ? new Blob([markup], { type: 'image/svg+xml' })
      : await versPng(markup, action.taille)
  telecharge(blob, nomFichier(etat, action.extension))
}
