/**
 * The studio's storage schema, its validation, and the one-time upgrade from
 * the six pre-split keys. Sole writer of the `studio` key.
 */

import {
  DEFAULT_COLOR,
  DEFAULT_EXPRESSION,
  DEFAULT_SHAPE,
  defaultMontage,
  isAnimationState,
  isColorId,
  isExpressionId,
  isShapeId,
  parseMontage,
  type AnimationState,
  type Montage,
} from '../engine'
import { ecris, efface, lis, NOMS_LEGACY, type NomLegacy } from '../i18n/stockage'
import { isBannerId, type BannerId } from '../ui/scene'
import {
  isDeskKind,
  isThemeChoice,
  type BannerCopy,
  type DeskKind,
  type ImageConfig,
  type Look,
  type ThemeChoice,
  type VideoConfig,
} from './types'

export const STUDIO_DOC_VERSION = 2 as const

export const DEFAULT_BANNER_COPY: BannerCopy = {
  welcome: 'Welcome',
  event1: '',
  event2: '',
  presentedBy: 'Presented by',
}

/**
 * @internal Serialized shape. Components consume `DeskConfig` and friends;
 * keeping the schema private is what stops it leaking the way the six legacy
 * keys did.
 */
export interface StudioDoc {
  readonly version: typeof STUDIO_DOC_VERSION
  readonly focus: DeskKind
  readonly theme: ThemeChoice
  readonly shared: { readonly bannerCopy: BannerCopy }
  readonly image: ImageConfig
  readonly video: VideoConfig
}

export function defaultLook<K extends DeskKind>(owner: K): Look<K> {
  return {
    owner,
    shape: DEFAULT_SHAPE,
    colour: DEFAULT_COLOR,
    expression: DEFAULT_EXPRESSION,
    banner: null,
  }
}

export function defaultStudioDoc(): StudioDoc {
  return {
    version: STUDIO_DOC_VERSION,
    focus: 'image',
    theme: 'system',
    shared: { bannerCopy: { ...DEFAULT_BANNER_COPY } },
    image: { kind: 'image', look: defaultLook('image'), pose: 'Idle' },
    video: { kind: 'video', look: defaultLook('video'), pose: 'Idle', montage: defaultMontage() },
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null
}

function pickString<T extends string>(
  value: unknown,
  guard: (v: string) => v is T,
  fallback: T,
): T {
  return typeof value === 'string' && guard(value) ? value : fallback
}

function parseBanner(value: unknown): BannerId | null {
  return typeof value === 'string' && isBannerId(value) ? value : null
}

function parsePose(value: unknown): AnimationState {
  return pickString(value, isAnimationState, 'Idle')
}

function parseLook<K extends DeskKind>(raw: unknown, owner: K): Look<K> {
  const it = asRecord(raw)
  if (!it) return defaultLook(owner)
  return {
    owner,
    shape: pickString(it.shape, isShapeId, DEFAULT_SHAPE),
    colour: pickString(it.colour, isColorId, DEFAULT_COLOR),
    expression: pickString(it.expression, isExpressionId, DEFAULT_EXPRESSION),
    banner: parseBanner(it.banner),
  }
}

function parseBannerCopy(raw: unknown): BannerCopy {
  const it = asRecord(raw)
  if (!it) return { ...DEFAULT_BANNER_COPY }
  const text = (v: unknown) => (typeof v === 'string' ? v : '')
  const welcome = text(it.welcome)
  const presentedBy = text(it.presentedBy)
  return {
    welcome: welcome.trim() ? welcome : DEFAULT_BANNER_COPY.welcome,
    event1: text(it.event1),
    event2: text(it.event2),
    presentedBy: presentedBy.trim() ? presentedBy : DEFAULT_BANNER_COPY.presentedBy,
  }
}

function parseMontageField(raw: unknown): Montage {
  if (raw === undefined || raw === null) return defaultMontage()
  return parseMontage(JSON.stringify(raw))
}

/**
 * Total. Every field falls back to its own default rather than discarding the
 * whole document, so one bad id never costs the user their other desk.
 */
export function parseStudioDoc(raw: string | null): StudioDoc | null {
  if (!raw) return null
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return null
  }
  const it = asRecord(data)
  if (!it) return null

  const image = asRecord(it.image)
  const video = asRecord(it.video)
  return {
    version: STUDIO_DOC_VERSION,
    focus: typeof it.focus === 'string' && isDeskKind(it.focus) ? it.focus : 'image',
    theme: typeof it.theme === 'string' && isThemeChoice(it.theme) ? it.theme : 'system',
    shared: { bannerCopy: parseBannerCopy(asRecord(it.shared)?.bannerCopy) },
    image: {
      kind: 'image',
      look: parseLook(image?.look, 'image'),
      pose: parsePose(image?.pose),
    },
    video: {
      kind: 'video',
      look: parseLook(video?.look, 'video'),
      pose: parsePose(video?.pose),
      montage: parseMontageField(video?.montage),
    },
  }
}

export function serializeStudioDoc(doc: StudioDoc): string {
  return JSON.stringify(doc)
}

/**
 * One-time upgrade from the six pre-split keys.
 *
 * Both desks are seeded from the same legacy look, so nobody's bot changes on
 * upgrade; they diverge only once the user edits one.
 */
export function migrateLegacy(read: (key: NomLegacy) => string | null): StudioDoc | null {
  const present = NOMS_LEGACY.some((key) => read(key) !== null)
  if (!present) return null

  const base = defaultStudioDoc()
  const fond = read('fond')
  const banner = fond && fond !== 'aucun' && isBannerId(fond) ? fond : null
  const shape = pickString(read('forme'), isShapeId, DEFAULT_SHAPE)
  const colour = pickString(read('couleur'), isColorId, DEFAULT_COLOR)
  const expression = pickString(read('expression'), isExpressionId, DEFAULT_EXPRESSION)

  let bannerCopy = { ...DEFAULT_BANNER_COPY }
  const copyRaw = read('fondCopy')
  if (copyRaw) {
    try {
      bannerCopy = parseBannerCopy(JSON.parse(copyRaw))
    } catch {
      // keep the defaults; a corrupt copy blob is not worth losing the look over
    }
  }

  return {
    ...base,
    shared: { bannerCopy },
    image: {
      kind: 'image',
      look: { owner: 'image', shape, colour, expression, banner },
      pose: 'Idle',
    },
    video: {
      kind: 'video',
      look: { owner: 'video', shape, colour, expression, banner },
      pose: 'Idle',
      montage: parseMontage(read('cycles')),
    },
  }
}

/**
 * Load, migrating if needed.
 *
 * The new key is written before the legacy keys are dropped, so a crash between
 * the two leaves both present and the next load sees `studio` and skips
 * migration.
 */
export function loadDoc(): StudioDoc {
  const existing = parseStudioDoc(lis('studio'))
  if (existing) {
    dropLegacy()
    return existing
  }
  const migrated = migrateLegacy(lis)
  if (!migrated) return defaultStudioDoc()
  saveDoc(migrated)
  dropLegacy()
  return migrated
}

function dropLegacy() {
  for (const key of NOMS_LEGACY) efface(key)
}

/** The single persistence writer in the app. */
export function saveDoc(doc: StudioDoc) {
  ecris('studio', serializeStudioDoc(doc))
}
