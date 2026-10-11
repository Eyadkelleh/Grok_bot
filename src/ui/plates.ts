/**
 * Banner asset manifest. Slot geometry lives in scene.ts; plates own URLs and ink.
 */

import type { BannerId } from './scene'

import thumb01 from '../assets/banners/plate-banner01.png'
import thumb2 from '../assets/banners/plate-banner2.png'
import thumb3 from '../assets/banners/plate-banner3.png'

import b01blob1 from '../assets/banners/banner01/banner01-blob1.svg'
import b01blob2 from '../assets/banners/banner01/banner01-blob2.svg'
import b01blob3 from '../assets/banners/banner01/banner01-blob3.svg'
import b01blob4 from '../assets/banners/banner01/banner01-blob4.svg'
import b01union from '../assets/banners/banner01/banner01-union.svg'
import b01spacex from '../assets/banners/banner01/banner01-spacex.svg'

import b2bg from '../assets/banners/banner2/bg.jpg'
import b2spacex from '../assets/banners/banner2/spacex.svg'

import b3bg from '../assets/banners/banner3/bg.jpg'
import b3spacex from '../assets/banners/banner3/spacex.svg'

export type EncreBanniere = 'sombre' | 'clair'

export interface CalqueDecor {
  src: string
  /** Percent of banner frame (0–100), CSS-style. */
  left: number
  top: number
  width: number
  height: number
  rotate?: number
}

export interface PlateBanniere {
  id: BannerId
  labelKey: string
  encre: EncreBanniere
  thumb: string
  /** Solid fill under décor (Banner 01). */
  fondHex?: string
  /** Landscape photo drawn rotated into the portrait frame. */
  photo?: string
  decor: CalqueDecor[]
  spacex: string
}

export const PLATES: readonly PlateBanniere[] = [
  {
    id: 'banner-01',
    labelKey: 'fond.banner01',
    encre: 'sombre',
    thumb: thumb01,
    fondHex: '#ffffff',
    decor: [
      { src: b01blob4, left: 75, top: 2.5, width: 18, height: 6, rotate: -18 },
      { src: b01blob3, left: 4, top: 16, width: 25, height: 8, rotate: 6 },
      { src: b01union, left: 55, top: 25, width: 34, height: 10 },
      { src: b01blob1, left: 64, top: 57, width: 54, height: 20, rotate: 15 },
      { src: b01blob2, left: -11, top: 70, width: 50, height: 15, rotate: 154 },
    ],
    spacex: b01spacex,
  },
  {
    id: 'banner-2',
    labelKey: 'fond.banner2',
    encre: 'clair',
    thumb: thumb2,
    photo: b2bg,
    decor: [],
    spacex: b2spacex,
  },
  {
    id: 'banner-3',
    labelKey: 'fond.banner3',
    encre: 'clair',
    thumb: thumb3,
    photo: b3bg,
    decor: [],
    spacex: b3spacex,
  },
]

export const PLATE_BY_ID = new Map<BannerId, PlateBanniere>(PLATES.map((p) => [p.id, p]))

export function plateDe(id: BannerId): PlateBanniere {
  const plate = PLATE_BY_ID.get(id)
  if (!plate) throw new Error(`unknown banner ${id}`)
  return plate
}
