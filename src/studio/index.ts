/**
 * The studio's public surface. Modules inside `studio/` import each other
 * directly; everything outside it comes through here, which is what keeps
 * `desk.ts` internals — and any second writer to `StudioDoc` — unreachable.
 */

export type { DeskFor, ImageDesk, Transport, VideoDesk } from './desk'
export type { DeliveryOffer, DeliveryState, DeliveryStatus, FormatFor } from './delivery'
export { defaultStudioDoc, parseStudioDoc, saveDoc, type StudioDoc } from './doc'
export { hrefForDesk } from './location'
export { createStudioSession, STUDIO, useStudio, type StudioSession } from './session'
export { THEME_CHOICES, type ThemeController } from './theme'
export {
  VERBS,
  type PeekAttr,
  type VerbDataMode,
  type VerbId,
  type VerbSpec,
} from './verbs'
export type {
  BannerCopy,
  ConfigFor,
  DeskConfig,
  DeskFrame,
  DeskKind,
  ImageConfig,
  Look,
  LookFacet,
  PickerBand,
  Theme,
  ThemeChoice,
  VideoConfig,
} from './types'
