/**
 * Flatten export frames onto a solid matte.
 *
 * GIF transparency is one bit and video has none. A clear canvas reads as the
 * viewer's checker. Painting the fill, then compositing leftover alpha over it,
 * is what keeps a required background solid.
 */

/** Parse `#rrggbb` into sRGB. Site `rgb()` / short hex are not used on this path. */
export function rgbDe(fond: string): [number, number, number] {
  const m = /^#([0-9a-f]{6})$/i.exec(fond.trim())
  if (!m) throw new Error(`invalid matte ${fond}`)
  const n = Number.parseInt(m[1]!, 16)
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff]
}

/**
 * Composite every pixel over `fond`. No-op when `fond` is null — that is the
 * transparent GIF path, where the checker is intended.
 *
 * Already-opaque pixels are left alone so the bot's ink is not washed out.
 */
export function aplatitSurFond(px: Uint8ClampedArray, fond: string | null): void {
  if (!fond) return
  const [fr, fv, fb] = rgbDe(fond)
  for (let p = 0; p < px.length; p += 4) {
    const a = px[p + 3]! / 255
    if (a >= 1) continue
    px[p] = Math.round(fr * (1 - a) + px[p]! * a)
    px[p + 1] = Math.round(fv * (1 - a) + px[p + 1]! * a)
    px[p + 2] = Math.round(fb * (1 - a) + px[p + 2]! * a)
    px[p + 3] = 255
  }
}

export function matteEstOpaque(px: Uint8ClampedArray): boolean {
  if (px.length < 4) return false
  for (let p = 3; p < px.length; p += 4) {
    if (px[p] !== 255) return false
  }
  return true
}

/** Clear the canvas, then paint the matte when a fill is required. */
export function poseFond(
  ctx: CanvasRenderingContext2D,
  taille: number,
  fond: string | null,
) {
  ctx.clearRect(0, 0, taille, taille)
  if (!fond) return
  ctx.fillStyle = fond
  ctx.fillRect(0, 0, taille, taille)
}

/**
 * Flatten leftover canvas alpha onto `fond` after the SVG is drawn.
 *
 * `fillRect` covers the cadre in a real browser. This second pass still runs
 * so a required matte cannot leave fully transparent pixels into the encoder.
 */
export function scelleMatte(
  ctx: CanvasRenderingContext2D,
  taille: number,
  fond: string | null,
) {
  if (!fond) return
  const image = ctx.getImageData(0, 0, taille, taille)
  aplatitSurFond(image.data, fond)
  ctx.putImageData(image, 0, 0)
}
