import { describe, expect, it } from 'vitest'
import { gifAnime } from '../gif'

/** Opaque square on a transparent field, like the bot on paper. */
function image(cote: number, couleur: [number, number, number], decalage = 0) {
  const px = new Uint8ClampedArray(cote * cote * 4)
  for (let y = 2; y < cote - 2; y++) {
    for (let x = 2 + decalage; x < cote - 2; x++) {
      const p = (y * cote + x) * 4
      px[p] = couleur[0]
      px[p + 1] = couleur[1]
      px[p + 2] = couleur[2]
      px[p + 3] = 255
    }
  }
  return px
}

/** Read GIF structure: header, extensions, frame count. */
function litGif(f: Uint8Array) {
  const txt = (o: number, n: number) => String.fromCharCode(...f.subarray(o, o + n))
  const bits = (f[10]! & 0x07) + 1
  let o = 13 + 3 * (1 << bits)
  let images = 0
  let boucle: number | null = null
  let delai: number | null = null
  let transparent: number | null = null
  let elimination: number | null = null
  while (o < f.length && f[o] !== 0x3b) {
    if (f[o] === 0x21 && f[o + 1] === 0xff) {
      boucle = f[o + 16]! + f[o + 17]! * 256
      o += 19
    } else if (f[o] === 0x21 && f[o + 1] === 0xf9) {
      elimination = (f[o + 3]! >> 2) & 0x07
      transparent = f[o + 3]! & 0x01 ? f[o + 6]! : null
      delai = f[o + 4]! + f[o + 5]! * 256
      o += 8
    } else if (f[o] === 0x2c) {
      images++
      o += 11
      while (o < f.length && f[o] !== 0) o += 1 + f[o]!
      o++
    } else break
  }
  return {
    entete: txt(0, 6),
    largeur: f[6]! + f[7]! * 256,
    hauteur: f[8]! + f[9]! * 256,
    tablePresente: !!(f[10]! & 0x80),
    couleursTable: 1 << bits,
    images,
    boucle,
    delai,
    transparent,
    elimination,
    finTrouvee: f[f.length - 1] === 0x3b,
  }
}

/**
 * Minimal LZW decoder. A subtly wrong encoder produces a file every reader
 * rejects, and nothing in the structure shows why.
 */
function decodeGif(f: Uint8Array) {
  const bits = (f[10]! & 0x07) + 1
  let o = 13 + 3 * (1 << bits)
  const images: number[][] = []
  while (o < f.length && f[o] !== 0x3b) {
    if (f[o] === 0x21) {
      o += 2
      while (o < f.length && f[o] !== 0) o += 1 + f[o]!
      o++
    } else if (f[o] === 0x2c) {
      o += 10
      const min = f[o]!
      o++
      const donnees: number[] = []
      while (o < f.length && f[o] !== 0) {
        const n = f[o]!
        for (let k = 1; k <= n; k++) donnees.push(f[o + k]!)
        o += 1 + n
      }
      o++

      const clear = 1 << min
      const eoi = clear + 1
      let taille = min + 1
      let dico: number[][] = []
      const reset = () => {
        dico = []
        for (let i = 0; i < clear; i++) dico[i] = [i]
        dico[clear] = []
        dico[eoi] = []
        taille = min + 1
      }
      reset()
      const sortie: number[] = []
      let reserve = 0
      let nbBits = 0
      let precedent: number[] | null = null
      for (let i = 0; i <= donnees.length; i++) {
        if (i < donnees.length) {
          reserve |= donnees[i]! << nbBits
          nbBits += 8
        }
        while (nbBits >= taille) {
          const code = reserve & ((1 << taille) - 1)
          reserve >>= taille
          nbBits -= taille
          if (code === eoi) {
            nbBits = 0
            break
          }
          if (code === clear) {
            reset()
            precedent = null
            continue
          }
          let entree = dico[code]
          if (!entree) {
            if (!precedent) throw new Error('unknown code with no previous')
            entree = [...precedent, precedent[0]!]
          }
          sortie.push(...entree)
          if (precedent) dico.push([...precedent, entree[0]!])
          if (dico.length === 1 << taille && taille < 12) taille++
          precedent = entree
        }
      }
      images.push(sortie)
    } else break
  }
  return images
}

describe('animated GIF', () => {
  const suite = [image(16, [10, 10, 12]), image(16, [10, 10, 12], 2), image(16, [249, 249, 249])]

  it('produces a well-formed looping GIF89a', () => {
    const g = litGif(gifAnime(suite, 16, 16, 50))
    expect(g.entete).toBe('GIF89a')
    expect(g.largeur).toBe(16)
    expect(g.hauteur).toBe(16)
    expect(g.images).toBe(3)
    expect(g.finTrouvee).toBe(true)
    expect(g.tablePresente).toBe(true)
    expect(g.couleursTable).toBe(4)
    expect(g.boucle).toBe(0)
  })

  it('declares transparent index 0 and disposes to background', () => {
    const g = litGif(gifAnime(suite, 16, 16, 50))
    expect(g.transparent).toBe(0)
    expect(g.elimination).toBe(2)
  })

  it('converts delay to hundredths and never goes below two', () => {
    expect(litGif(gifAnime(suite, 16, 16, 50)).delai).toBe(5)
    expect(litGif(gifAnime(suite, 16, 16, 100)).delai).toBe(10)
    expect(litGif(gifAnime(suite, 16, 16, 5)).delai).toBe(2)
  })

  it('refuses an empty animation', () => {
    expect(() => gifAnime([], 16, 16, 50)).toThrow()
  })

  it('does not announce transparency on already-flattened frames', () => {
    const cote = 8
    const opaque = new Uint8ClampedArray(cote * cote * 4).fill(255)
    const g = litGif(gifAnime([opaque, opaque], cote, cote, 50))
    expect(g.transparent).toBeNull()
    expect(g.elimination).toBe(1)
  })

  it('stays under 256 colours even on a gradient', () => {
    const degrade = new Uint8ClampedArray(64 * 64 * 4)
    for (let i = 0; i < 64 * 64; i++) {
      degrade[i * 4] = i % 256
      degrade[i * 4 + 1] = (i * 7) % 256
      degrade[i * 4 + 2] = (i * 13) % 256
      degrade[i * 4 + 3] = 255
    }
    const g = litGif(gifAnime([degrade], 64, 64, 50))
    expect(g.couleursTable).toBeLessThanOrEqual(256)
    expect(g.images).toBe(1)
  })
})

describe('LZW round trip', () => {
  it('recovers the pixels of a simple image', () => {
    const px = image(16, [10, 10, 12])
    const gif = gifAnime([px], 16, 16, 50)
    const [decode] = decodeGif(gif)
    expect(decode).toHaveLength(16 * 16)
    const attendu: number[] = []
    for (let i = 0; i < 16 * 16; i++) attendu.push(px[i * 4 + 3]! < 128 ? 0 : 1)
    expect(decode).toEqual(attendu)
  })

  it('recovers pixels on an image with many colours', () => {
    const cote = 40
    const px = new Uint8ClampedArray(cote * cote * 4)
    for (let i = 0; i < cote * cote; i++) {
      px[i * 4] = (i * 5) % 200
      px[i * 4 + 1] = (i * 11) % 200
      px[i * 4 + 2] = (i * 17) % 200
      px[i * 4 + 3] = 255
    }
    const [decode] = decodeGif(gifAnime([px], cote, cote, 50))
    expect(decode).toHaveLength(cote * cote)
    expect(decode!.every((v) => v > 0)).toBe(true)
  })
})
