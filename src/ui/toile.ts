/**
 * Paint a Scene onto a canvas. Callers size the canvas to scene.cadre first.
 */

import { plateDe, type PlateBanniere } from './plates'
import {
  BANNER_REF_H,
  BANNER_REF_W,
  mesureScene,
  plateDest,
  type Overlay,
  type Rect,
  type Scene,
} from './scene'

const MARGE_SUJET = 0.08

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`image failed ${src}`))
    img.src = src
  })
}

function imageSize(img: CanvasImageSource): { iw: number; ih: number } {
  if (img instanceof HTMLImageElement) {
    return { iw: img.naturalWidth || img.width, ih: img.naturalHeight || img.height }
  }
  if (img instanceof HTMLCanvasElement) {
    return { iw: img.width, ih: img.height }
  }
  if (typeof ImageBitmap !== 'undefined' && img instanceof ImageBitmap) {
    return { iw: img.width, ih: img.height }
  }
  return { iw: 1, ih: 1 }
}

function drawContain(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  slot: Rect,
  marge = 0,
) {
  const pad = Math.min(slot.w, slot.h) * marge
  const box = {
    x: slot.x + pad,
    y: slot.y + pad,
    w: slot.w - pad * 2,
    h: slot.h - pad * 2,
  }
  const { iw, ih } = imageSize(img)
  const scale = Math.min(box.w / iw, box.h / ih)
  const dw = iw * scale
  const dh = ih * scale
  ctx.drawImage(img, box.x + (box.w - dw) / 2, box.y + (box.h - dh) / 2, dw, dh)
}

/** Landscape photo rotated -90° into the portrait banner plate (Figma). */
function drawPhotoPortrait(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dest: { dx: number; dy: number; dw: number; dh: number },
) {
  ctx.save()
  ctx.translate(dest.dx + dest.dw / 2, dest.dy + dest.dh / 2)
  ctx.rotate(-Math.PI / 2)
  // After -90°, the photo's width maps to banner height.
  ctx.drawImage(img, -dest.dh / 2, -dest.dw / 2, dest.dh, dest.dw)
  ctx.restore()
}

function drawDecor(
  ctx: CanvasRenderingContext2D,
  plate: PlateBanniere,
  dest: { dx: number; dy: number; dw: number; dh: number },
  images: Map<string, HTMLImageElement>,
) {
  for (const layer of plate.decor) {
    const img = images.get(layer.src)
    if (!img) continue
    const x = dest.dx + (layer.left / 100) * dest.dw
    const y = dest.dy + (layer.top / 100) * dest.dh
    const w = (layer.width / 100) * dest.dw
    const h = (layer.height / 100) * dest.dh
    ctx.save()
    if (layer.rotate) {
      ctx.translate(x + w / 2, y + h / 2)
      ctx.rotate((layer.rotate * Math.PI) / 180)
      ctx.drawImage(img, -w / 2, -h / 2, w, h)
    } else {
      ctx.drawImage(img, x, y, w, h)
    }
    ctx.restore()
  }
}

function drawText(
  ctx: CanvasRenderingContext2D,
  overlay: Extract<Overlay, { kind: 'texte' }>,
  slot: Rect,
  fill: string,
) {
  const lines = overlay.copy.split('\n').filter((l) => l.trim()).slice(0, overlay.maxLines)
  if (!lines.length) return
  const fontSize = Math.max(12, slot.h / (overlay.maxLines * 1.35))
  ctx.fillStyle = fill
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `400 ${fontSize}px system-ui, -apple-system, sans-serif`
  const lineH = fontSize * 1.2
  const startY = slot.y + slot.h / 2 - ((lines.length - 1) * lineH) / 2
  lines.forEach((line, i) => {
    ctx.fillText(line, slot.x + slot.w / 2, startY + i * lineH, slot.w * 0.95)
  })
}

export async function preparePlateAssets(plate: PlateBanniere): Promise<Map<string, HTMLImageElement>> {
  const urls = new Set<string>([plate.spacex, ...plate.decor.map((d) => d.src)])
  if (plate.photo) urls.add(plate.photo)
  const map = new Map<string, HTMLImageElement>()
  await Promise.all(
    [...urls].map(async (src) => {
      map.set(src, await loadImage(src))
    }),
  )
  return map
}

/**
 * Paint fond, décor, overlays, then sujet. `opaque` forces white under vide
 * (MP4). Banner plates are already opaque.
 */
export async function peintScene(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  sujet: CanvasImageSource | null,
  opts: { opaque: boolean },
): Promise<void> {
  const { width, height } = scene.cadre
  ctx.clearRect(0, 0, width, height)

  if (scene.fond.kind === 'vide') {
    if (opts.opaque) {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, width, height)
    }
  } else if (scene.fond.kind === 'aplat') {
    ctx.fillStyle = scene.fond.hex
    ctx.fillRect(0, 0, width, height)
  } else {
    const plate = plateDe(scene.fond.id)
    const assets = await preparePlateAssets(plate)
    const dest = plateDest(scene.cadre)

    if (plate.fondHex) {
      ctx.fillStyle = plate.fondHex
      ctx.fillRect(dest.dx, dest.dy, dest.dw, dest.dh)
    } else {
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, width, height)
    }

    if (plate.photo) {
      const photo = assets.get(plate.photo)
      if (photo) drawPhotoPortrait(ctx, photo, dest)
    }

    drawDecor(ctx, plate, dest, assets)

    const slots = mesureScene(scene)
    const ink = plate.encre === 'clair' ? '#ffffff' : '#000000'
    for (const overlay of scene.overlays) {
      if (overlay.kind === 'texte') {
        drawText(ctx, overlay, slots[overlay.slot], ink)
      } else {
        const mark = assets.get(plate.spacex)
        if (mark) drawContain(ctx, mark, slots.wordmark, 0)
      }
    }

    if (sujet) drawContain(ctx, sujet, slots.logo, MARGE_SUJET)
    return
  }

  const slots = mesureScene(scene)
  if (sujet) {
    if (width === height) {
      ctx.drawImage(sujet as CanvasImageSource, 0, 0, width, height)
    } else {
      drawContain(ctx, sujet, slots.logo, MARGE_SUJET)
    }
  }
}

/** CSS percentages for DOM stage preview, derived from the same slot table. */
export function styleSlot(slot: Rect, cadreW: number, cadreH: number): Record<string, string> {
  return {
    left: `${(slot.x / cadreW) * 100}%`,
    top: `${(slot.y / cadreH) * 100}%`,
    width: `${(slot.w / cadreW) * 100}%`,
    height: `${(slot.h / cadreH) * 100}%`,
  }
}

export { BANNER_REF_W, BANNER_REF_H }
