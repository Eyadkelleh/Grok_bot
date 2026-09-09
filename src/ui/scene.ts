/**
 * Scene: backdrop + overlays + avatar sujet under one FrameSpec.
 * Banner artboard is always 1800×5400. Output size is FrameSpec only.
 */

export const BANNER_REF_W = 1800
export const BANNER_REF_H = 5400

export type BannerId = 'banner-01' | 'banner-2' | 'banner-3'
export type SlotId = 'welcome' | 'logo' | 'event' | 'presentedBy' | 'wordmark'

export const BANNER_IDS: readonly BannerId[] = ['banner-01', 'banner-2', 'banner-3']

export function isBannerId(value: string): value is BannerId {
  return (BANNER_IDS as readonly string[]).includes(value)
}

export type FrameSpec =
  | { fit: 'cover' | 'contain'; width: number; height: number }
  | { fit: 'slot'; slot: SlotId; width: number; height: number }

export type Fond =
  | { kind: 'aplat'; hex: string }
  | { kind: 'vide' }
  | { kind: 'banniere'; id: BannerId }

export type Overlay =
  | {
      kind: 'texte'
      slot: Extract<SlotId, 'welcome' | 'event' | 'presentedBy'>
      copy: string
      maxLines: 1 | 2
    }
  | { kind: 'marque'; slot: Extract<SlotId, 'wordmark'> }

export interface Sujet {
  kind: 'avatar'
  slot: Extract<SlotId, 'logo'>
}

export interface Scene {
  cadre: FrameSpec
  fond: Fond
  overlays: Overlay[]
  sujet: Sujet
}

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export type Mesure = Record<SlotId, Rect>

/** Slots in banner reference pixels (Figma 1800×5400). */
export const SLOTS_BANNER: Readonly<Mesure> = {
  welcome: { x: 200, y: 480, w: 1400, h: 200 },
  logo: { x: 450, y: 2050, w: 900, h: 520 },
  event: { x: 250, y: 2680, w: 1300, h: 320 },
  presentedBy: { x: 400, y: 4460, w: 1000, h: 80 },
  wordmark: { x: 450, y: 4700, w: 900, h: 140 },
}

export const CADRE_BANNER_PNG: FrameSpec = {
  fit: 'contain',
  width: 600,
  height: 1800,
}

export const CADRE_BANNER_MP4: FrameSpec = {
  fit: 'contain',
  width: 400,
  height: 1200,
}

export const CADRE_CARRE_MP4: FrameSpec = {
  fit: 'cover',
  width: 1024,
  height: 1024,
}

export function rectangleCover(
  sourceLargeur: number,
  sourceHauteur: number,
  cibleLargeur: number,
  cibleHauteur: number,
): Readonly<{ sx: number; sy: number; sw: number; sh: number }> {
  const sourceRatio = sourceLargeur / sourceHauteur
  const cibleRatio = cibleLargeur / cibleHauteur
  if (sourceRatio > cibleRatio) {
    const sw = sourceHauteur * cibleRatio
    return { sx: (sourceLargeur - sw) / 2, sy: 0, sw, sh: sourceHauteur }
  }
  const sh = sourceLargeur / cibleRatio
  return { sx: 0, sy: (sourceHauteur - sh) / 2, sw: sourceLargeur, sh }
}

export function rectangleContain(
  sourceLargeur: number,
  sourceHauteur: number,
  cibleLargeur: number,
  cibleHauteur: number,
): Readonly<{ dx: number; dy: number; dw: number; dh: number }> {
  const scale = Math.min(cibleLargeur / sourceLargeur, cibleHauteur / sourceHauteur)
  const dw = sourceLargeur * scale
  const dh = sourceHauteur * scale
  return {
    dx: (cibleLargeur - dw) / 2,
    dy: (cibleHauteur - dh) / 2,
    dw,
    dh,
  }
}

/** Map banner-space slots into the output FrameSpec. */
export function mesureScene(scene: Scene): Mesure {
  const { width, height, fit } = scene.cadre
  if (fit === 'slot') {
    const focus = SLOTS_BANNER[scene.cadre.slot]
    const crop = rectangleCover(focus.w, focus.h, width, height)
    const scale = width / crop.sw
    const map = (r: Rect): Rect => ({
      x: (r.x - focus.x - crop.sx) * scale,
      y: (r.y - focus.y - crop.sy) * scale,
      w: r.w * scale,
      h: r.h * scale,
    })
    return {
      welcome: map(SLOTS_BANNER.welcome),
      logo: map(SLOTS_BANNER.logo),
      event: map(SLOTS_BANNER.event),
      presentedBy: map(SLOTS_BANNER.presentedBy),
      wordmark: map(SLOTS_BANNER.wordmark),
    }
  }

  const box =
    fit === 'contain'
      ? rectangleContain(BANNER_REF_W, BANNER_REF_H, width, height)
      : (() => {
          const c = rectangleCover(BANNER_REF_W, BANNER_REF_H, width, height)
          const scale = width / c.sw
          return {
            dx: -c.sx * scale,
            dy: -c.sy * scale,
            dw: BANNER_REF_W * scale,
            dh: BANNER_REF_H * scale,
          }
        })()

  const scale = box.dw / BANNER_REF_W
  const map = (r: Rect): Rect => ({
    x: box.dx + r.x * scale,
    y: box.dy + r.y * scale,
    w: r.w * scale,
    h: r.h * scale,
  })
  return {
    welcome: map(SLOTS_BANNER.welcome),
    logo: map(SLOTS_BANNER.logo),
    event: map(SLOTS_BANNER.event),
    presentedBy: map(SLOTS_BANNER.presentedBy),
    wordmark: map(SLOTS_BANNER.wordmark),
  }
}

/** Where the full banner plate lands on the canvas for contain/cover. */
export function plateDest(cadre: FrameSpec): {
  dx: number
  dy: number
  dw: number
  dh: number
} {
  if (cadre.fit === 'slot') {
    const focus = SLOTS_BANNER[cadre.slot]
    const crop = rectangleCover(focus.w, focus.h, cadre.width, cadre.height)
    const scale = cadre.width / crop.sw
    return {
      dx: -(focus.x + crop.sx) * scale,
      dy: -(focus.y + crop.sy) * scale,
      dw: BANNER_REF_W * scale,
      dh: BANNER_REF_H * scale,
    }
  }
  if (cadre.fit === 'contain') {
    return rectangleContain(BANNER_REF_W, BANNER_REF_H, cadre.width, cadre.height)
  }
  const c = rectangleCover(BANNER_REF_W, BANNER_REF_H, cadre.width, cadre.height)
  const scale = cadre.width / c.sw
  return {
    dx: -c.sx * scale,
    dy: -c.sy * scale,
    dw: BANNER_REF_W * scale,
    dh: BANNER_REF_H * scale,
  }
}

export function sceneBanniere(
  id: BannerId,
  cadre: FrameSpec,
  copy: { welcome: string; event1: string; event2: string; presentedBy: string },
): Scene {
  const overlays: Overlay[] = [
    { kind: 'texte', slot: 'welcome', copy: copy.welcome, maxLines: 1 },
    {
      kind: 'texte',
      slot: 'event',
      copy: [copy.event1, copy.event2].filter((l) => l.trim()).join('\n'),
      maxLines: 2,
    },
    { kind: 'texte', slot: 'presentedBy', copy: copy.presentedBy, maxLines: 1 },
    { kind: 'marque', slot: 'wordmark' },
  ]
  return {
    cadre,
    fond: { kind: 'banniere', id },
    overlays: overlays.filter((o) => o.kind === 'marque' || o.copy.trim()),
    sujet: { kind: 'avatar', slot: 'logo' },
  }
}

export function sceneDepuisFondGif(
  fond: 'blanc' | 'transparent',
  cadre: FrameSpec,
): Scene {
  return {
    cadre,
    fond: fond === 'blanc' ? { kind: 'aplat', hex: '#ffffff' } : { kind: 'vide' },
    overlays: [],
    sujet: { kind: 'avatar', slot: 'logo' },
  }
}
