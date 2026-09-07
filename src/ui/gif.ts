/**
 * Animated GIF encoder. Pure: pixels in, bytes out, no DOM.
 *
 * GIF is a flipbook. Its delay is in hundredths of a second, transparency is
 * one bit, and the palette is shared across every frame. That is why a cycle
 * is scanned twice — once to count colours, once to index — instead of keeping
 * 255 MB of raw pixels in memory.
 */

/** Unsigned little-endian integer on `n` bytes. */
function le(valeur: number, n: number): number[] {
  const out: number[] = []
  for (let i = 0; i < n; i++) out.push((valeur / 2 ** (8 * i)) & 0xff)
  return out
}

const ascii = (s: string) => Array.from(s, (c) => c.charCodeAt(0))

/**
 * GIF LZW: variable-width codes, LSB first, packed into sub-blocks of at most
 * 255 bytes. The encoder must widen codes one step late (`suivant > 1 << taille`):
 * it writes a dictionary entry right after emitting a code, while the decoder
 * only writes its own when it reads the *next* code.
 */
function lzw(indices: Uint8Array, bitsParPixel: number): number[] {
  const clear = 1 << bitsParPixel
  const fin = clear + 1
  let taille = bitsParPixel + 1
  let suivant = fin + 1
  let dico = new Map<string, number>()

  const octets: number[] = []
  let reserve = 0
  let bits = 0
  const ecris = (code: number) => {
    reserve |= code << bits
    bits += taille
    while (bits >= 8) {
      octets.push(reserve & 0xff)
      reserve >>= 8
      bits -= 8
    }
  }

  ecris(clear)
  let prefixe = String(indices[0])
  for (let i = 1; i < indices.length; i++) {
    const c = indices[i]!
    const cle = `${prefixe},${c}`
    const connu = dico.get(cle)
    if (connu !== undefined) {
      prefixe = String(connu)
      continue
    }
    ecris(Number(prefixe))
    if (suivant < 4096) {
      dico.set(cle, suivant++)
      if (suivant > 1 << taille && taille < 12) taille++
    } else {
      ecris(clear)
      dico = new Map()
      taille = bitsParPixel + 1
      suivant = fin + 1
    }
    prefixe = String(c)
  }
  ecris(Number(prefixe))
  ecris(fin)
  if (bits > 0) octets.push(reserve & 0xff)

  const sortie: number[] = [bitsParPixel]
  for (let i = 0; i < octets.length; i += 255) {
    const bloc = octets.slice(i, i + 255)
    sortie.push(bloc.length, ...bloc)
  }
  sortie.push(0)
  return sortie
}

/**
 * Shared palette, index 0 reserved for transparency.
 *
 * Built in two steps — count colours, then index frames — because a GIF needs
 * one palette for the whole file. A first-come palette would fill with the
 * first frames' antialiasing and dump every later tint into one slot.
 */
export interface PaletteGif {
  vues: Map<number, number>
  index: Map<number, number>
  proches: Map<number, number>
  transparence: boolean
}

export const nouvellePalette = (): PaletteGif => ({
  vues: new Map(),
  index: new Map(),
  proches: new Map(),
  transparence: false,
})

/** Count pixels per colour. Transparent pixels only set the flag. */
export function recense(palette: PaletteGif, px: Uint8ClampedArray) {
  for (let p = 0; p < px.length; p += 4) {
    if (px[p + 3]! < 128) {
      palette.transparence = true
      continue
    }
    const cle = (px[p]! << 16) | (px[p + 1]! << 8) | px[p + 2]!
    palette.vues.set(cle, (palette.vues.get(cle) ?? 0) + 1)
  }
}

/** Keep the 255 most frequent colours. */
function arrete(palette: PaletteGif) {
  if (palette.index.size) return
  const tries = [...palette.vues.entries()].sort((a, b) => b[1] - a[1]).slice(0, 255)
  for (const [cle] of tries) palette.index.set(cle, palette.index.size + 1)
}

/** Nearest kept colour, cached so each unseen tint costs one search. */
function plusProche(palette: PaletteGif, cle: number) {
  const connu = palette.proches.get(cle)
  if (connu !== undefined) return connu
  const r = (cle >> 16) & 0xff
  const v = (cle >> 8) & 0xff
  const b = cle & 0xff
  let meilleur = 1
  let ecart = Infinity
  for (const [autre, i] of palette.index) {
    const dr = r - ((autre >> 16) & 0xff)
    const dv = v - ((autre >> 8) & 0xff)
    const db = b - (autre & 0xff)
    const d = dr * dr + dv * dv + db * db
    if (d < ecart) {
      ecart = d
      meilleur = i
    }
  }
  palette.proches.set(cle, meilleur)
  return meilleur
}

/** One palette index per pixel. */
export function indexe(palette: PaletteGif, px: Uint8ClampedArray): Uint8Array {
  arrete(palette)
  const out = new Uint8Array(px.length / 4)
  for (let i = 0, p = 0; i < out.length; i++, p += 4) {
    if (px[p + 3]! < 128) continue
    const cle = (px[p]! << 16) | (px[p + 1]! << 8) | px[p + 2]!
    out[i] = palette.index.get(cle) ?? plusProche(palette, cle)
  }
  return out
}

/** Pack raw frames into an animated GIF. */
export function gifAnime(
  images: Uint8ClampedArray[],
  largeur: number,
  hauteur: number,
  delaiMs: number,
): Uint8Array<ArrayBuffer> {
  if (!images.length) throw new Error('no frames to pack')
  const palette = nouvellePalette()
  for (const px of images) recense(palette, px)
  return gifIndexe(
    palette,
    images.map((px) => indexe(palette, px)),
    largeur,
    hauteur,
    delaiMs,
  )
}

/**
 * Same as gifAnime, but on frames already indexed — the bounded-memory path
 * for long sequences.
 */
export function gifIndexe(
  palette: PaletteGif,
  images: Uint8Array[],
  largeur: number,
  hauteur: number,
  delaiMs: number,
): Uint8Array<ArrayBuffer> {
  if (!images.length) throw new Error('no frames to pack')

  arrete(palette)
  const transparence = palette.transparence
  const couleurs = palette.index
  const bits = Math.max(2, Math.ceil(Math.log2(couleurs.size + 1)))
  const tailleTable = 1 << bits

  const table: number[] = [0, 0, 0]
  for (const cle of couleurs.keys()) table.push((cle >> 16) & 0xff, (cle >> 8) & 0xff, cle & 0xff)
  while (table.length < tailleTable * 3) table.push(0)

  const out: number[] = [
    ...ascii('GIF89a'),
    ...le(largeur, 2),
    ...le(hauteur, 2),
    0x80 | (bits - 1),
    0,
    0,
    ...table,
    0x21,
    0xff,
    0x0b,
    ...ascii('NETSCAPE2.0'),
    0x03,
    0x01,
    ...le(0, 2),
    0x00,
  ]

  const delai = Math.max(2, Math.round(delaiMs / 10))

  for (const indices of images) {
    out.push(
      0x21,
      0xf9,
      0x04,
      transparence ? (2 << 2) | 0x01 : 1 << 2,
      ...le(delai, 2),
      0,
      0x00,
      0x2c,
      ...le(0, 2),
      ...le(0, 2),
      ...le(largeur, 2),
      ...le(hauteur, 2),
      0,
      ...lzw(indices, bits),
    )
  }

  out.push(0x3b)
  return new Uint8Array(out)
}
