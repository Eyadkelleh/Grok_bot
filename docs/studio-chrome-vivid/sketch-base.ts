/**
 * Aura Spectrum Rail — architecture sketch.
 *
 * Signatures only. Existing domain types are repeated as imports to show
 * ownership; this file is not intended to compile as an implementation.
 */

import type { CSSProperties, ComputedRef, Ref } from 'vue'
import type { ColorId } from '@/engine'
import type { ImageDesk, VideoDesk } from '@/studio/desk'
import type {
  LookFacet,
  PickerBand,
  ThemeChoice,
} from '@/studio/types'

export type VerbId = Exclude<PickerBand, null>
export type VerbDataMode = 'shape' | 'expression' | 'colour' | 'state'
export type SectionId = 'rollup' | 'settings' | 'about'
export type LocaleId = 'en' | 'fr' | 'zh-Hans'

export interface VerbSpec {
  id: VerbId
  dataMode: VerbDataMode
  labelKey: string
  railIndex: 0 | 1 | 2 | 3
}

export interface ChromeAccent {
  /** The exact committed bot colour used by the engine. */
  sourceHex: `#${string}`
  /** A contrast-safe display tint for chrome glow and thin markers. */
  displayHex: `#${string}`
  rgb: readonly [red: number, green: number, blue: number]
  contrastHex: '#000000' | '#ffffff'
  cssVars: Readonly<{
    '--bot-accent': string
    '--bot-accent-rgb': string
    '--accent-contrast': string
    '--accent-display': string
  }>
}

/** Only shared logic module introduced by this design. */
export declare function resolveChromeAccent(
  colour: ColorId | `#${string}`,
): ChromeAccent

export declare function chromeAccentStyle(
  accent: ChromeAccent,
): CSSProperties

/**
 * Everything below is component-local design, shown here only to make
 * ownership explicit. It must not become a directory of one-function modules.
 */
interface StageChromeModel {
  openBand: Ref<PickerBand>
  accent: ComputedRef<ChromeAccent>
  activeRailIndex: ComputedRef<number | null>
  verbs: readonly VerbSpec[]
}

/**
 * Local to Stage.vue. It calls Desk directly; no pass-through controller or
 * command module sits between Stage and Desk.
 */
declare function bindStageChrome(
  desk: ImageDesk | VideoDesk,
  accent: ComputedRef<ChromeAccent>,
): StageChromeModel

declare function onVerbKeydown(
  event: KeyboardEvent,
  focusedIndex: number,
  verbs: readonly VerbSpec[],
  openBand: (band: PickerBand) => void,
): void

declare function facetFromPickerTarget(
  target: EventTarget | null,
): LookFacet | null

declare function canPreviewFacet(
  facet: LookFacet,
  isPlaying: boolean,
): boolean

interface PickerVisibility {
  open: boolean
  inert: boolean
  ariaHidden: 'true' | undefined
}

declare function pickerVisibility(
  band: PickerBand,
  candidate: VerbId,
): PickerVisibility

interface SectionNavState {
  active: Ref<SectionId>
  registerSection(id: SectionId, element: HTMLElement | null): void
  scrollTo(id: SectionId): void
  dispose(): void
}

/**
 * Local to App.vue. App owns the observer and keeps @click.prevent on each anchor.
 * This state never reads or writes location.hash.
 */
declare function bindSectionNav(
  ids: readonly SectionId[],
): SectionNavState

export interface ThemeWellSpec {
  id: ThemeChoice
  labelKey: string
  descriptionKey: string
  sample: 'paper' | 'charcoal' | 'split'
}

export interface LocaleRowSpec {
  id: LocaleId
  label: string
  primary: boolean
  nested: boolean
}

interface RovingRadioGroup<T extends string> {
  focused: Ref<T>
  onKeydown(event: KeyboardEvent, current: T): void
}

/**
 * Local to Settings.vue. Persistence remains inside the existing theme and
 * i18n owners.
 */
declare function bindRovingRadioGroup<T extends string>(
  orderedIds: readonly T[],
  selected: ComputedRef<T>,
  choose: (id: T) => void,
): RovingRadioGroup<T>

declare const VERBS: readonly VerbSpec[]
declare const THEME_WELLS: readonly ThemeWellSpec[]
declare const LOCALE_ROWS: readonly LocaleRowSpec[]
