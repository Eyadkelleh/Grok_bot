/**
 * Candidate 3 — sealed desks + occupancy pebble.
 *
 * Caller's usage (spec). Types below are derived from this, not the reverse.
 *
 *   const studio = openStudio(window)
 *   studio.hydrate()
 *   studio.occupy('motion')
 *   studio.still.setLook({ shape: 'round', colour: 'orange', expression: 'neutral' })
 *   studio.motion.setLook({ shape: 'hex', colour: 'black', expression: 'wink' })
 *   deskView(studio.occupied) // fields, timeline, exports for the shell
 *   await commitExport(studio, { kind: 'still', format: 'png' }, svg)
 *   await commitExport(studio, { kind: 'motion', format: 'mp4', source: 'montage' })
 *   chooseTheme(studio.theme, 'dark')
 *
 * App.vue call site: bind OccupancyPebble + PhantomStudio + conditional Timeline
 * to this handle. Do not import customise.ts or fond.ts as singletons.
 *
 * ExportBar call site: receive DeskView.exports; emit ExportRequest;
 * never a decorative videoSource radio.
 *
 * Theme call site: Settings wells call chooseTheme; main.ts paints
 * documentElement from resolvedTheme(studio.theme).
 */

import type {
  AnimationState,
  AvatarSpec,
  Block,
  ColorId,
  Cycle,
  ExpressionId,
  Montage,
  ShapeId,
} from '../../../../src/engine'
import type { BannerCopy } from '../../../../src/fond'
import type { ActionId } from '../../../../src/ui/export'
import type { BannerId } from '../../../../src/ui/scene'

// ---------------------------------------------------------------------------
// Looks and desks. Look is a shared *shape*. Freeze vs live are different
// types so motion pose cannot be stored on the still desk by assignment.
// ---------------------------------------------------------------------------

export interface Look {
  shape: ShapeId
  colour: ColorId
  expression: ExpressionId
}

/** Catalogue still. No clock, no hash, no sampler. Image owns this. */
export interface Freeze {
  state: AnimationState
}

/**
 * Video-owned time. `pose` is the committed picker. `playhead` / `playing`
 * are playback. The sampler must not write `pose`.
 */
export interface LiveMotion {
  pose: AnimationState
  playing: boolean
  playhead: number
}

export interface BannerSelection {
  id: BannerId | null
  copy: BannerCopy
}

export interface StillDesk {
  readonly kind: 'still'
  look: Look
  freeze: Freeze
  banner: BannerSelection
}

export interface MotionDesk {
  readonly kind: 'motion'
  look: Look
  live: LiveMotion
  montage: Montage
  banner: BannerSelection
}

export type Desk = StillDesk | MotionDesk
export type Occupancy = Desk['kind']

export interface StillPatch {
  look?: Partial<Look>
  freeze?: AnimationState
  banner?: Partial<BannerSelection>
}

export interface MotionPatch {
  look?: Partial<Look>
  live?: Partial<LiveMotion>
  montage?: Montage
  banner?: Partial<BannerSelection>
}

// ---------------------------------------------------------------------------
// Theme. Three paints stay distinct: chrome tokens, DEFAULT_PAPER stage well,
// export BLANC. Banner encre is plate-owned and is not a theme input.
// ---------------------------------------------------------------------------

export type ThemeChoice = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

export interface ThemeState {
  choice: ThemeChoice
  resolved: ResolvedTheme
}

export interface ChromeTokens {
  canvas: string
  ink: string
  muted: string
  line: string
  paper: string
  shadow: string
  wash: string
  /**
   * Always DEFAULT_PAPER (`#f5f5f4`). Dark chrome does not retint this.
   * Stage Avatar.paper and the CSS --stage well both read it.
   */
  stage: string
}

export const STAGE_WELL = '#f5f5f4' as const
export const EXPORT_MATTE = '#ffffff' as const

export function resolveTheme(
  choice: ThemeChoice,
  prefersDark: boolean,
): ResolvedTheme {
  void choice
  void prefersDark
  throw new Error('not implemented')
}

export function tokensFor(theme: ResolvedTheme): ChromeTokens {
  void theme
  throw new Error('not implemented')
}

export function applyTheme(root: HTMLElement, theme: ResolvedTheme): void {
  // TODO: root.dataset.theme = theme; root.style.colorScheme = theme
  void root
  void theme
  throw new Error('not implemented')
}

export function chooseTheme(state: ThemeState, choice: ThemeChoice): ThemeState {
  void state
  void choice
  throw new Error('not implemented')
}

// ---------------------------------------------------------------------------
// Occupancy URL. Path owns the room. Hash stays #etat= for motion share.
// ---------------------------------------------------------------------------

export interface OccupancyUrl {
  occupancy: Occupancy
  /** Present only when occupancy is motion and the hash named a pose. */
  sharedPose: AnimationState | null
  playing: boolean
}

export function parseLocation(url: URL): OccupancyUrl {
  void url
  throw new Error('not implemented')
}

export function writeLocation(
  url: URL,
  occupancy: Occupancy,
  live: LiveMotion,
): string {
  // still → `/` with hash cleared
  // motion → `/video#etat=<slug>` or `&stop`
  void url
  void occupancy
  void live
  throw new Error('not implemented')
}

// ---------------------------------------------------------------------------
// Studio handle — public surface. Hides dual blobs, key names, poseCycle.
// ---------------------------------------------------------------------------

export interface StudioEnv {
  location: Location
  history: History
  localStorage: Storage
  matchMedia: typeof matchMedia
}

export interface Studio {
  readonly occupancy: Occupancy
  readonly still: StillDeskHandle
  readonly motion: MotionDeskHandle
  readonly occupied: Desk
  readonly theme: ThemeState
  hydrate(): void
  occupy(next: Occupancy): void
}

export interface StillDeskHandle {
  readonly snapshot: StillDesk
  setLook(look: Look): void
  setFreeze(state: AnimationState): void
  setBanner(banner: BannerSelection): void
  patch(patch: StillPatch): void
}

export interface MotionDeskHandle {
  readonly snapshot: MotionDesk
  setLook(look: Look): void
  setPose(pose: AnimationState): void
  setBanner(banner: BannerSelection): void
  play(): void
  pause(): void
  seek(t: number): void
  editMontage(montage: Montage): void
  patch(patch: MotionPatch): void
}

export function openStudio(env: StudioEnv): Studio {
  void env
  throw new Error('not implemented')
}

export function applyStillPatch(desk: StillDesk, patch: StillPatch): StillDesk {
  void desk
  void patch
  throw new Error('not implemented')
}

export function applyMotionPatch(desk: MotionDesk, patch: MotionPatch): MotionDesk {
  void desk
  void patch
  throw new Error('not implemented')
}

/**
 * Playback sample. Reads montage + playhead. Must not mutate live.pose.
 * When paused, returns live.pose.
 */
export function shownState(desk: MotionDesk): AnimationState {
  void desk
  throw new Error('not implemented')
}

export function avatarSpecFor(desk: Desk): AvatarSpec {
  // paper is always STAGE_WELL for the on-stage bot
  void desk
  throw new Error('not implemented')
}

// ---------------------------------------------------------------------------
// Shell view. PhantomStudio learns which pickers and exports exist from this
// instead of coordinating Timeline + ExportBar + singletons.
// ---------------------------------------------------------------------------

export type FieldId = 'shape' | 'expression' | 'colour' | 'fond' | 'freeze' | 'live'

export type TimelineChrome = 'hidden' | 'docked'

export type StillExportId = 'png' | 'svg' | 'banner-png'
export type MotionExportId = 'gif' | 'mp4' | 'banner-mp4' | 'grab-png'
export type DeskExportId = StillExportId | MotionExportId

export interface DeskView {
  occupancy: Occupancy
  look: Look
  banner: BannerSelection
  /** Still: freeze.state. Motion: shownState(desk). */
  state: AnimationState
  fields: readonly FieldId[]
  timeline: TimelineChrome
  exports: readonly DeskExportId[]
  /** Stage Avatar.paper — STAGE_WELL, never chrome canvas, never BLANC. */
  paper: typeof STAGE_WELL
  playing: boolean
  playhead: number | null
  blocks: readonly Block[]
  cycle: Cycle | null
}

export function deskView(desk: Desk): DeskView {
  void desk
  throw new Error('not implemented')
}

// ---------------------------------------------------------------------------
// Export. Cross-kind requests are unrepresentable.
// ---------------------------------------------------------------------------

export type StillExportRequest =
  | { kind: 'still'; format: 'png' | 'svg' }
  | { kind: 'still'; format: 'banner-png' }

export type MotionExportRequest =
  | { kind: 'motion'; format: 'gif' | 'mp4' | 'banner-mp4'; source: 'pose' | 'montage' }
  | { kind: 'motion'; format: 'grab-png' }

export type ExportRequest = StillExportRequest | MotionExportRequest

export interface ExportPlan {
  request: ExportRequest
  look: Look
  /** Off-screen dated Avatar never receives STAGE_WELL; capture uses BLANC. */
  matte: typeof EXPORT_MATTE
  cycle: Cycle | null
  filenameStem: string
}

export function planExport(desk: Desk, request: ExportRequest): ExportPlan {
  // TODO: refuse still+mp4 / motion+svg at this boundary (should already be untyped)
  void desk
  void request
  throw new Error('not implemented')
}

export async function commitExport(
  studio: Studio,
  request: ExportRequest,
  liveSvg?: SVGSVGElement | null,
  signal?: AbortSignal,
): Promise<void> {
  void studio
  void request
  void liveSvg
  void signal
  throw new Error('not implemented')
}

/** Occupied-desk check used by commitExport. Not a public App concern. */
export function requestFitsDesk(desk: Desk, request: ExportRequest): boolean {
  void desk
  void request
  throw new Error('not implemented')
}

// ---------------------------------------------------------------------------
// Persistence. Keys stay inside this module. Callers never see NomStocke.
// ---------------------------------------------------------------------------

export type DeskBlobV1 = {
  v: 1
} & (
  | { kind: 'still'; look: Look; freeze: Freeze; banner: BannerSelection }
  | {
      kind: 'motion'
      look: Look
      live: Pick<LiveMotion, 'pose'>
      montage: Montage
      banner: BannerSelection
    }
)

export interface LegacyLook {
  shape: string | null
  colour: string | null
  expression: string | null
  fond: string | null
  fondCopy: string | null
  cycles: string | null
}

export function hydrateDesks(
  storage: Storage,
  sharedPose: AnimationState | null,
): { still: StillDesk; motion: MotionDesk } {
  // TODO: read desk:still / desk:motion; if missing, copy legacy keys into both
  void storage
  void sharedPose
  throw new Error('not implemented')
}

export function persistDesk(storage: Storage, desk: Desk): void {
  void storage
  void desk
  throw new Error('not implemented')
}

export function persistTheme(storage: Storage, choice: ThemeChoice): void {
  void storage
  void choice
  throw new Error('not implemented')
}

export function persistOccupancy(storage: Storage, occupancy: Occupancy): void {
  void storage
  void occupancy
  throw new Error('not implemented')
}

// ---------------------------------------------------------------------------
// Occupancy pebble. Unique menu, not a tab strip.
// ---------------------------------------------------------------------------

export interface OccupancyPebbleProps {
  occupancy: Occupancy
  stillInk: ColorId
  motionInk: ColorId
}

export interface OccupancyPebbleEvents {
  occupy: Occupancy
}

/**
 * Map an ExportBar click onto a typed request. Replaces ActionId + videoSource.
 * `action` is a UI id; illegal pairs fail here, not in App.surExport.
 */
export function requestFromAction(
  occupancy: Occupancy,
  action: ActionId | 'banner-png' | 'banner-mp4' | 'grab-png',
  source: 'pose' | 'montage' = 'pose',
): ExportRequest {
  void occupancy
  void action
  void source
  throw new Error('not implemented')
}
