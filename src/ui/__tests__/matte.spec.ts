import { describe, expect, it } from 'vitest'
import { gifAnime } from '../gif'
import { BLANC, couleurDeFond, FOND_GIF_DEFAUT } from '../export'
import { aplatitSurFond, matteEstOpaque, poseFond, rgbDe, scelleMatte } from '../matte'

/** Fully transparent stage — the checker, if the matte never lands. */
function stageVide(cote: number) {
  return new Uint8ClampedArray(cote * cote * 4)
}

function coin(px: Uint8ClampedArray, cote: number, x: number, y: number) {
  const p = (y * cote + x) * 4
  return { r: px[p]!, v: px[p + 1]!, b: px[p + 2]!, a: px[p + 3]! }
}

function litGif(f: Uint8Array) {
  const bits = (f[10]! & 0x07) + 1
  let o = 13 + 3 * (1 << bits)
  let transparent: number | null = null
  while (o < f.length && f[o] !== 0x3b) {
    if (f[o] === 0x21 && f[o + 1] === 0xf9) {
      transparent = f[o + 3]! & 0x01 ? f[o + 6]! : null
      o += 8
    } else if (f[o] === 0x2c) {
      o += 11
      while (o < f.length && f[o] !== 0) o += 1 + f[o]!
      o++
    } else if (f[o] === 0x21) {
      o += 2
      while (o < f.length && f[o] !== 0) o += 1 + f[o]!
      o++
    } else break
  }
  return transparent
}

describe('matte', () => {
  it('fails if a required fill leaves the stage fully transparent', () => {
    const cote = 16
    const stage = stageVide(cote)
    expect(coin(stage, cote, 0, 0).a).toBe(0)
    expect(matteEstOpaque(stage)).toBe(false)

    aplatitSurFond(stage, BLANC)

    expect(matteEstOpaque(stage)).toBe(true)
    expect(coin(stage, cote, 0, 0)).toEqual({ r: 255, v: 255, b: 255, a: 255 })
    expect(coin(stage, cote, cote - 1, cote - 1)).toEqual({ r: 255, v: 255, b: 255, a: 255 })
  })

  it('leaves a transparent GIF stage clear', () => {
    const stage = stageVide(8)
    aplatitSurFond(stage, couleurDeFond('transparent'))
    expect(coin(stage, 8, 0, 0).a).toBe(0)
    expect(matteEstOpaque(stage)).toBe(false)
  })

  it('composites leftover edge alpha over the fill without washing opaque ink', () => {
    const px = new Uint8ClampedArray([
      10, 10, 12, 255, // ink, already opaque
      0, 0, 0, 0, // cadre
      20, 20, 20, 128, // antialiased edge
    ])
    aplatitSurFond(px, BLANC)
    expect([...px.subarray(0, 4)]).toEqual([10, 10, 12, 255])
    expect([...px.subarray(4, 8)]).toEqual([255, 255, 255, 255])
    expect(px[7]).toBe(255)
    expect(px[4]).toBeGreaterThan(100)
  })

  it('paints the default GIF/MP4 fill, not site paper', () => {
    expect(FOND_GIF_DEFAUT).toBe('blanc')
    expect(couleurDeFond(FOND_GIF_DEFAUT)).toBe(BLANC)
    expect(rgbDe(BLANC)).toEqual([255, 255, 255])
  })

  it('does not declare GIF transparency after flattening a clear stage', () => {
    const cote = 8
    const stage = stageVide(cote)
    aplatitSurFond(stage, BLANC)
    expect(litGif(gifAnime([stage], cote, cote, 50))).toBeNull()
  })
})

describe('canvas matte', () => {
  function toile(cote: number) {
    const data = new Uint8ClampedArray(cote * cote * 4)
    const ctx = {
      fillStyle: '#000000' as string,
      clearRect() {
        data.fill(0)
      },
      fillRect() {
        const [r, v, b] = rgbDe(String(this.fillStyle))
        for (let i = 0; i < data.length; i += 4) {
          data[i] = r
          data[i + 1] = v
          data[i + 2] = b
          data[i + 3] = 255
        }
      },
      getImageData() {
        return { data, width: cote, height: cote } as ImageData
      },
      putImageData(image: ImageData) {
        data.set(image.data)
      },
    }
    return { ctx: ctx as unknown as CanvasRenderingContext2D, data }
  }

  it('fillRect covers a transparent canvas when a fill is required', () => {
    const { ctx, data } = toile(4)
    poseFond(ctx, 4, BLANC)
    expect(matteEstOpaque(data)).toBe(true)
    expect(data[0]).toBe(255)
    expect(data[3]).toBe(255)
  })

  it('seals leftover transparent pixels after the SVG is drawn', () => {
    const { ctx, data } = toile(4)
    poseFond(ctx, 4, BLANC)
    data[3] = 0
    data[0] = 0
    data[1] = 0
    data[2] = 0
    scelleMatte(ctx, 4, BLANC)
    expect(matteEstOpaque(data)).toBe(true)
    expect(coin(data, 4, 0, 0)).toEqual({ r: 255, v: 255, b: 255, a: 255 })
  })

  it('does not paint when the GIF asks for a clear canvas', () => {
    const { ctx, data } = toile(4)
    poseFond(ctx, 4, null)
    scelleMatte(ctx, 4, null)
    expect(data[3]).toBe(0)
  })
})
