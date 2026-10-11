/**
 * Candidate 1 — type sketch for the Image/Video desk split + first-class theme.
 *
 * Written as if it lives at `src/studio/types.ts`. On implementation this file
 * splits along the module map (doc / desk / session / theme / location /
 * delivery); it is one file here so a reader can trace input → output without
 * jumping. Bodies throw `not implemented`; tricky logic is `// TODO` pseudocode.
 *
 * Core idea: a **Desk** is the unit of ownership. One desk per output kind. A
 * desk owns its look, its pose, (video only) its montage and transport, and the
 * capability to deliver its own artifact. There is no importable global
 * appearance value, so cross-desk mutation is not "discouraged" — it is
 * unreachable.
 */

import type { ComputedRef } from 'vue'
import type {
  AnimationState,
  Block,
  ColorId,
  Cycle,
  ExpressionId,
  Montage,
  ShapeId,
} from '../engine'
import type { BannerCopy } from '../fond' // BannerCopy moves to studio/types on implementation
import type { BannerId } from '../ui/scene'

// ---------------------------------------------------------------------------
// 1. Desk identity and the ownership brand
// ---------------------------------------------------------------------------

export type DeskKind = 'image' | 'video'

/**
 * Appearance of one desk's bot.
 *
 * Three independent guarantees make cross-desk contamination a type error or a
 * physical impossibility rather than a convention:
 *
 * 1. `owner` brands the value. `Look<'image'>` is not assignable to
 *    `Look<'video'>`, so a commit cannot land on the wrong desk even through a
 *    generic helper.
 * 2. Every field is `readonly`. A Look is a value, never a mutable cell, so two
 *    desks holding the same reference still cannot observe each other's edits.
 * 3. No module exports a live look. `customise.ts`'s `shape` / `colour` /
 *    `expression` computeds are deleted; the only way to reach a look is through
 *    the desk you were handed.
 *
 * per encode-lessons-in-structure.
 */
export interface Look<K extends DeskKind = DeskKind> {
  readonly owner: K
  readonly shape: ShapeId
  readonly colour: ColorId
  readonly expression: ExpressionId
  /** Banner *plate* is per desk: it is composition, part of this artifact. */
  readonly banner: BannerId | null
}

/**
 * One picker interaction. Pickers change exactly one facet, which is also the
 * unit of hover preview, so `preview` and `commit` share this type.
 *
 * Discriminated so `{ field: 'shape', value: 'happy' }` does not compile.
 */
export type LookFacet =
  | { field: 'shape'; value: ShapeId }
  | { field: 'colour'; value: ColorId }
  | { field: 'expression'; value: ExpressionId }
  | { field: 'banner'; value: BannerId | null }
  | { field: 'pose'; value: AnimationState }

/** Which picker band is open on a desk. Not a "mode": one open panel at a time. */
export type PickerBand = 'shape' | 'expression' | 'colour' | 'banner' | 'pose' | null

// ---------------------------------------------------------------------------
// 2. Desk configuration — the persisted, independent state
// ---------------------------------------------------------------------------

export interface ImageConfig {
  readonly kind: 'image'
  readonly look: Look<'image'>
  /** The pose the still is frozen in. No transport, so no second writer. */
  readonly pose: AnimationState
}

export interface VideoConfig {
  readonly kind: 'video'
  readonly look: Look<'video'>
  /** The pose shown when the transport is stopped. While playing, derived. */
  readonly pose: AnimationState
  /** Video owns montage. `Montage` is non-optional: "no montage" cannot happen. */
  readonly montage: Montage
}

export type DeskConfig = ImageConfig | VideoConfig
export type ConfigFor<K extends DeskKind> = Extract<DeskConfig, { kind: K }>

// ---------------------------------------------------------------------------
// 3. What the stage renders — one computed, nothing for the component to derive
// ---------------------------------------------------------------------------

/**
 * Everything `<Avatar>` and `<BannerBackdrop>` need, fully resolved.
 *
 * Folds in, behind one value: hover preview overriding the committed facet,
 * playback-derived pose, and the theme-derived stage paper. `Stage.vue` binds
 * this and computes nothing, which is what makes the desk interface deep rather
 * than a bag of refs.
 *
 * Invariant: `blocks` is empty and `playhead` is null on an image desk. The
 * live-morph path in `Avatar.vue` treats that as "no montage", which is the
 * behaviour it already has today for a null playhead.
 */
export interface DeskFrame {
  readonly shape: ShapeId
  readonly colour: ColorId
  readonly expression: ExpressionId
  readonly pose: AnimationState
  readonly banner: BannerId | null
  /**
   * Stage paper only — the fill behind the eye mask on screen.
   * Never the delivery matte. See `stagePaper` below.
   */
  readonly paper: string
  readonly playhead: number | null
  readonly blocks: readonly Block[]
}

// ---------------------------------------------------------------------------
// 4. Delivery — export as a desk capability, typed per kind
// ---------------------------------------------------------------------------

/**
 * The formats a desk can produce. An image desk cannot be asked for mp4:
 * `image.deliver('mp4')` is a compile error, not a runtime guard.
 */
export type FormatFor<K extends DeskKind> = {
  image: 'png' | 'svg' | 'banner-png'
  video: 'gif' | 'mp4' | 'banner-mp4'
}[K]

export type DeliveryState = 'ready' | 'busy' | 'done' | 'error'

export interface DeliveryStatus<K extends DeskKind> {
  readonly state: DeliveryState
  /** 0–100 for framed formats, null for one-shot stills. */
  readonly progress: number | null
  /**
   * Formats offered *right now*. Policy lives here so the export bar has none:
   * `banner-*` appears only when a plate is chosen, `mp4` only when
   * `videoPossible()`.
   */
  readonly formats: readonly FormatFor<K>[]
}

export interface Delivery {
  readonly filename: string
  readonly bytes: number
}

export interface DeliveryOptions {
  readonly onProgress?: (done: number, total: number) => void
  readonly signal?: AbortSignal
}

/** A still delivery needs the on-screen SVG and none is attached. */
export class StageUnavailable extends Error {
  constructor() {
    super('stage svg not attached')
    this.name = 'StageUnavailable'
  }
}

// ---------------------------------------------------------------------------
// 5. The Desk interface
// ---------------------------------------------------------------------------

interface DeskBase<K extends DeskKind> {
  readonly kind: K

  /** Committed, persisted configuration. Read-only: writes go through `commit`. */
  readonly config: ComputedRef<ConfigFor<K>>

  /** Fully resolved render input. Preview and playback are already folded in. */
  readonly frame: ComputedRef<DeskFrame>

  /** Which picker band is open on this desk. Per desk, so switching keeps place. */
  readonly band: ComputedRef<PickerBand>

  readonly delivery: ComputedRef<DeliveryStatus<K>>

  /** Hover/focus peek. Never persists. `null` clears. */
  preview(facet: LookFacet | null): void

  /** Click-through. Validates, writes the doc, clears any preview. */
  commit(facet: LookFacet): void

  openBand(band: PickerBand): void

  /**
   * Produce the artifact.
   *
   * Idempotent under a double click on the same button: a second call with the
   * same format while busy returns the in-flight promise. A call with a
   * *different* format aborts the in-flight one and starts the new one, because
   * that is the user changing their mind.
   */
  deliver(format: FormatFor<K>, options?: DeliveryOptions): Promise<Delivery>

  cancelDelivery(): void

  /**
   * The stage registers its live `<svg>` here on mount and detaches on unmount.
   * Keyed to this desk, so a stale image stage can never serve a video
   * delivery. Returns the detach function.
   */
  attachStage(getSvg: () => SVGSVGElement | null): () => void
}

export interface ImageDesk extends DeskBase<'image'> {}

/** One edit to the montage. Reduced by a pure function; the UI stays a view. */
export type MontageEdit =
  | { op: 'select-cycle'; id: string }
  | { op: 'create-cycle'; name: string }
  | { op: 'rename-cycle'; id: string; name: string }
  | { op: 'remove-cycle'; id: string }
  | { op: 'set-blocks'; cycleId: string; blocks: readonly Block[] }
  | { op: 'append-block'; state: AnimationState }
  | { op: 'move-block'; from: number; to: number }

/**
 * Play/pause/seek for the video desk.
 *
 * The pose stomp is gone by construction: while `playing`, the rendered pose is
 * *derived* from `at` in `frame`, and nothing writes `config.pose`. Single
 * source of truth per invariant, derive instead of sync. This is also what lets
 * a shape change during playback keep the correct live animation — shape comes
 * from the look, pose from the playhead, and neither clobbers the other.
 */
export interface Transport {
  readonly playing: ComputedRef<boolean>
  /** Playhead in seconds within the active cycle. */
  readonly at: ComputedRef<number>
  readonly total: ComputedRef<number>
  play(): void
  pause(): void
  seek(seconds: number): void
}

export interface VideoDesk extends DeskBase<'video'> {
  readonly montage: ComputedRef<Montage>
  readonly activeCycle: ComputedRef<Cycle>
  readonly transport: Transport

  editMontage(edit: MontageEdit): void

  /**
   * Replace the active cycle's blocks with the synthesised clip for the current
   * pose (`poseCycle`). This is the visible, editable replacement for the old
   * decorative pose-vs-cycle radio: the choice becomes state you can see on the
   * track instead of a hidden flag. Idempotent — running it twice is a no-op.
   */
  clipCurrentPose(): void
}

export type DeskFor<K extends DeskKind> = K extends 'image' ? ImageDesk : VideoDesk

// ---------------------------------------------------------------------------
// 6. Theme — three paint layers kept in three owners
// ---------------------------------------------------------------------------

export type Theme = 'light' | 'dark'

/** `system` is a persisted *choice*; the resolved theme is derived, never stored. */
export type ThemeChoice = Theme | 'system'

export interface ThemeController {
  readonly choice: ComputedRef<ThemeChoice>
  /** Derived from `choice` + `prefers-color-scheme`. Single source of truth. */
  readonly resolved: ComputedRef<Theme>
  choose(next: ThemeChoice): void
}

/**
 * Paint layer 1 — chrome. Sets `documentElement.dataset.theme`; CSS owns the
 * token values. Mirrors the existing `documentElement.lang` precedent in
 * `i18n/index.ts`.
 */
export function applyChrome(theme: Theme): void {
  throw new Error('not implemented')
}

/**
 * Paint layer 2 — stage paper. The *only* theme-dependent paper in the system,
 * and it reaches exactly one place: `DeskFrame.paper` on the mounted stage
 * avatar.
 *
 * Deliberately not a parameter of anything in the delivery path. Layer 3, the
 * delivery matte, stays `BLANC` from `ui/export.ts`, and `engine/avatar.ts`'s
 * `DEFAULT_PAPER` is not touched at all — 27 committed goldens pin `#f5f5f4`.
 */
export function stagePaper(theme: Theme): string {
  throw new Error('not implemented')
}

/** Guard test: proves layer 3 never learned about the theme. */
export function assertDeliveryMatteIsThemeIndependent(): void {
  throw new Error('not implemented')
}

// ---------------------------------------------------------------------------
// 7. Session — two desks, one focus, one persistence writer
// ---------------------------------------------------------------------------

export interface StudioSession {
  readonly focus: ComputedRef<DeskKind>

  readonly image: ImageDesk
  readonly video: VideoDesk

  readonly theme: ThemeController

  /**
   * Event copy is shared. The *plate* is per desk (composition) but the words
   * are one event's content, so nobody retypes "Presented by" twice.
   */
  readonly bannerCopy: ComputedRef<BannerCopy>

  /**
   * What the hero actually renders: `deskOf(peek ?? focus).frame`. Adds the peek
   * policy on top of focus, which is why it is not a pass-through.
   */
  readonly stageFrame: ComputedRef<DeskFrame>

  focusDesk(kind: DeskKind): void

  /**
   * Lens-switch hover. Renders the *other* desk's bot on the hero without
   * changing focus, morphing through the existing engine. `null` clears.
   */
  peekDesk(kind: DeskKind | null): void

  setBannerCopy(patch: Partial<BannerCopy>): void

  /**
   * Explicit, opt-in sharing — the safe replacement for the accidental sharing
   * being deleted. Rebrands the value: `Look<'image'>` in, `Look<'video'>` out.
   */
  copyLook(from: DeskKind, to: DeskKind): void

  deskOf<K extends DeskKind>(kind: K): DeskFor<K>
}

export function createStudioSession(): StudioSession {
  // TODO
  // 1. doc = loadDoc()                       // migrates legacy keys on first run
  // 2. theme = createTheme(doc.theme, persist)
  // 3. image = createDesk('image', doc, persist)
  // 4. video = createDesk('video', doc, persist)
  // 5. focus = ref(doc.focus); peek = ref<DeskKind | null>(null)
  // 6. syncLocation(): single writer to location.hash, derived from
  //    (focus, deskOf(focus).config.pose, video.transport.playing)
  // 7. watch(hashchange) -> readLocation(fragment, focus) -> focusDesk + commit pose
  throw new Error('not implemented')
}

/** Injection key. Components receive the session; they never import a store. */
export const STUDIO: unique symbol = Symbol('studio') as never

export function useStudio(): StudioSession {
  throw new Error('not implemented')
}

export function useDesk<K extends DeskKind>(kind: K): DeskFor<K> {
  throw new Error('not implemented')
}

/** The focused desk, for components that follow focus (stage, export bar). */
export function useFocusedDesk(): ComputedRef<ImageDesk | VideoDesk> {
  throw new Error('not implemented')
}

// ---------------------------------------------------------------------------
// 8. Persistence — one document, one key, one writer
// ---------------------------------------------------------------------------

export const STUDIO_DOC_VERSION = 2 as const

/**
 * @internal Serialized shape. Only `doc.ts` and its tests may name this type;
 * components consume `DeskConfig` and friends. Keeping the storage schema
 * private is what stops it leaking into five components the way the five
 * legacy keys did.
 */
export interface StudioDoc {
  readonly version: typeof STUDIO_DOC_VERSION
  readonly focus: DeskKind
  readonly theme: ThemeChoice
  readonly shared: { readonly bannerCopy: BannerCopy }
  readonly image: ImageConfig
  readonly video: VideoConfig
}

/** Legacy keys, readable but no longer writable. `ecris('forme', …)` won't compile. */
export type LegacyKey = 'forme' | 'couleur' | 'expression' | 'cycles' | 'fond' | 'fondCopy'

/** Total. Never throws, never returns a partially valid doc. */
export function parseStudioDoc(raw: string | null): StudioDoc | null {
  // TODO validate at the boundary, per boundary-discipline: every id through
  // isShapeId / isColorId / isExpressionId / isAnimationState / isBannerId,
  // montage through parseMontage. Any failure on a field falls back to that
  // field's default rather than discarding the whole doc.
  throw new Error('not implemented')
}

export function serializeStudioDoc(doc: StudioDoc): string {
  throw new Error('not implemented')
}

export function defaultStudioDoc(): StudioDoc {
  throw new Error('not implemented')
}

/**
 * One-time upgrade from the five legacy keys.
 *
 * Both desks are seeded with the *same* legacy look, so nobody's bot changes
 * shape on upgrade; they diverge only once the user edits one. Focus starts on
 * `image` because the still is the cheaper first artifact and `png` is already
 * `ACTION_DEFAUT`.
 *
 * Returns null when there is nothing to migrate.
 */
export function migrateLegacy(read: (key: LegacyKey) => string | null): StudioDoc | null {
  throw new Error('not implemented')
}

/**
 * Load, migrating if needed.
 *
 * Crash-safe ordering: write the new `studio` key first, only then drop the
 * legacy keys. A crash between the two leaves both present, and the next load
 * sees `studio` and skips migration — idempotent, per make-operations-idempotent.
 */
export function loadDoc(): StudioDoc {
  throw new Error('not implemented')
}

/** The single persistence writer in the app. Debounced; last write wins. */
export function saveDoc(doc: StudioDoc): void {
  throw new Error('not implemented')
}

// ---------------------------------------------------------------------------
// 9. Location — the whole fragment, one owner, one writer
// ---------------------------------------------------------------------------

/**
 * The fragment is app-owned, so hash routing needs no dependency and no
 * dev-server history fallback. `#image/thinking`, `#video/orbit`,
 * `#video/orbit?play`.
 */
export interface LocationState {
  readonly focus: DeskKind
  readonly pose: AnimationState
  readonly playing: boolean
}

/**
 * `fallbackFocus` resolves the legacy `#etat=<slug>[&stop]` form, which encoded
 * no desk: the shared pose lands on whichever desk the doc had focused.
 */
export function readLocation(fragment: string, fallbackFocus: DeskKind): LocationState | null {
  throw new Error('not implemented')
}

/** Returns the fragment written, so the session can ignore its own echo. */
export function writeLocation(state: LocationState): string {
  throw new Error('not implemented')
}

// ---------------------------------------------------------------------------
// 10. Delivery internals — private to the desk
// ---------------------------------------------------------------------------

/**
 * Assemble and run one delivery. Not exported from the studio barrel: the only
 * caller is `Desk.deliver`, which is what keeps export payload assembly out of
 * `App.vue`'s 90-line switch and out of every component.
 *
 * @internal
 */
export function runDelivery<K extends DeskKind>(
  kind: K,
  format: FormatFor<K>,
  config: ConfigFor<K>,
  bannerCopy: BannerCopy,
  getSvg: (() => SVGSVGElement | null) | null,
  options?: DeliveryOptions,
): Promise<Delivery> {
  // TODO dispatch onto the existing export layer, unchanged:
  //   'png' | 'svg'      -> ui/capture.exporte(getSvg() ?? throw StageUnavailable, …)
  //   'gif' | 'mp4'      -> ui/capture.exporteMontage(format, activeCycle, reglages, …)
  //   'banner-png'       -> ui/bannerExport.exportBannerStill(look.banner!, copy, …)
  //   'banner-mp4'       -> ui/bannerExport.exportBannerMontage(look.banner!, copy, …)
  // `look.banner!` is safe: 'banner-*' is only ever in DeliveryStatus.formats
  // when a plate is set, and `formats` is the only surface the UI reads.
  //
  // No `paper` argument anywhere on this path. That absence is the encoding of
  // "the delivery matte is theme-independent" — there is nothing to pass.
  throw new Error('not implemented')
}

/**
 * Which formats are offerable given this config and this browser.
 * @internal
 */
export function offerableFormats<K extends DeskKind>(
  kind: K,
  config: ConfigFor<K>,
): readonly FormatFor<K>[] {
  throw new Error('not implemented')
}

// ---------------------------------------------------------------------------
// 11. Engine additions (belong next to the other cycle helpers)
// ---------------------------------------------------------------------------

/**
 * Pure reducer for montage edits. Lands in `engine/cycles.ts` beside
 * `blocksWith` / `moveBlock` / `uniqueName` / `nextCycleId` — it is cycle
 * knowledge, not studio knowledge, and putting it there means `Timeline.vue`
 * stops owning `cycles` and becomes a view over `VideoDesk.montage`.
 *
 * Total: an edit naming a missing cycle returns the montage unchanged.
 */
export function applyMontageEdit(montage: Montage, edit: MontageEdit): Montage {
  throw new Error('not implemented')
}

// ---------------------------------------------------------------------------
// 12. Test-facing helpers
// ---------------------------------------------------------------------------

/**
 * Friction probe is now desk-scoped. Half the existing flags (`montageLabeled`,
 * `cycleNamed`, `durationShown`) only apply to video, and only one desk is
 * mounted at a time, so the probe must be told which one it is scoring.
 */
export function frictionFlagsInScope(kind: DeskKind): readonly string[] {
  throw new Error('not implemented')
}
