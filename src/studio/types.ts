import type { AnimationState, Block, ColorId, ExpressionId, Montage, ShapeId } from '../engine'
import type { BannerId } from '../ui/scene'

export type DeskKind = 'image' | 'video'

export const DESK_KINDS: readonly DeskKind[] = ['image', 'video']

export function isDeskKind(value: string | null | undefined): value is DeskKind {
  return value === 'image' || value === 'video'
}

/**
 * Appearance of one desk's bot.
 *
 * `owner` brands the value so `Look<'image'>` is not assignable to
 * `Look<'video'>`: a mis-routed commit is a compile error, not a runtime bug.
 * Every field is readonly, so two desks holding the same reference still cannot
 * observe each other's edits.
 */
export interface Look<K extends DeskKind = DeskKind> {
  readonly owner: K
  readonly shape: ShapeId
  readonly colour: ColorId
  readonly expression: ExpressionId
  readonly banner: BannerId | null
}

/** One picker interaction, which is also the unit of hover preview. */
export type LookFacet =
  | { field: 'shape'; value: ShapeId }
  | { field: 'colour'; value: ColorId }
  | { field: 'expression'; value: ExpressionId }
  | { field: 'banner'; value: BannerId | null }
  | { field: 'pose'; value: AnimationState }

/** Which picker band is open on a desk. One at a time. */
export type PickerBand = 'shape' | 'expression' | 'colour' | 'banner' | 'pose' | null

export interface BannerCopy {
  welcome: string
  event1: string
  event2: string
  presentedBy: string
}

export interface ImageConfig {
  readonly kind: 'image'
  readonly look: Look<'image'>
  readonly pose: AnimationState
}

export interface VideoConfig {
  readonly kind: 'video'
  readonly look: Look<'video'>
  readonly pose: AnimationState
  /** Non-optional, so the over-broad "no montage" export guard has nothing to test. */
  readonly montage: Montage
}

export type DeskConfig = ImageConfig | VideoConfig
export type ConfigFor<K extends DeskKind> = Extract<DeskConfig, { kind: K }>

/**
 * Everything the stage renders, fully resolved: hover preview and playback pose
 * are already folded in, so the component derives nothing.
 *
 * `blocks` is empty and `playhead` null on the image desk, which `Avatar.vue`
 * already treats as "not dated".
 */
export interface DeskFrame {
  readonly shape: ShapeId
  readonly colour: ColorId
  readonly expression: ExpressionId
  readonly pose: AnimationState
  readonly banner: BannerId | null
  readonly playhead: number | null
  readonly blocks: readonly Block[]
}

export type Theme = 'light' | 'dark'

/** `system` is a persisted choice; the resolved theme is derived, never stored. */
export type ThemeChoice = Theme | 'system'

export function isThemeChoice(value: string | null | undefined): value is ThemeChoice {
  return value === 'light' || value === 'dark' || value === 'system'
}
