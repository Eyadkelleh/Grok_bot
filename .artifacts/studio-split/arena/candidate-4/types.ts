/**
 * Diptych Latch — candidate 4 type sketch.
 * Signatures only; bodies throw or TODO. Derived from DESIGN.md usage.
 */

import type {
  AnimationState,
  Block,
  ColorId,
  Cycle,
  ExpressionId,
  ShapeId,
} from '../../../../src/engine'
import type { ActionId, EtatExport } from '../../../../src/ui/export'
import type { ExportIntent, StillFormat, VideoFormat, VideoSourceKind } from '../../../../src/ui/intent'

// ---------------------------------------------------------------------------
// Branded desk identity — prevents cross-workshop assignment at compile time
// ---------------------------------------------------------------------------

declare const WorkshopKindBrand: unique symbol
export type WorkshopKind = ('still' | 'motion') & { readonly [WorkshopKindBrand]: true }

export const STILL: WorkshopKind = 'still' as WorkshopKind
export const MOTION: WorkshopKind = 'motion' as WorkshopKind

export function isWorkshopKind(v: string): v is WorkshopKind {
  return v === 'still' || v === 'motion'
}

// ---------------------------------------------------------------------------
// Look — shared slice, owned independently per workshop
// ---------------------------------------------------------------------------

export interface LookBundle {
  readonly shape: ShapeId
  readonly colour: ColorId
  readonly expression: ExpressionId
}

export type LookField = keyof LookBundle

export interface LookPatch {
  shape?: ShapeId
  colour?: ColorId
  expression?: ExpressionId
}

// ---------------------------------------------------------------------------
// Banner — per-workshop (independent from app chrome theme)
// ---------------------------------------------------------------------------

export interface BannerChoice {
  readonly plateId: string | null
  readonly copy: string
}

// ---------------------------------------------------------------------------
// Motion-only state
// ---------------------------------------------------------------------------

export interface PoseState {
  readonly current: AnimationState
  /** Slug we last wrote to #etat=; used to ignore echo hashchange */
  readonly lastHashWritten: string
}

export interface MontageState {
  readonly cycles: readonly Cycle[]
  readonly activeCycleId: string
}

export function activeCycle(montage: MontageState): Cycle | null {
  throw new Error('not implemented')
}

// ---------------------------------------------------------------------------
// Workshop capsules — discriminated union encodes ownership
// ---------------------------------------------------------------------------

interface WorkshopBase<K extends WorkshopKind> {
  readonly kind: K
  readonly look: LookBundle
  readonly banner: BannerChoice
}

export interface StillWorkshop extends WorkshopBase<'still'> {
  /** Still preview/export default pose; not user-picked, always Idle */
  readonly previewPose: 'Idle'
}

export interface MotionWorkshop extends WorkshopBase<'motion'> {
  readonly pose: PoseState
  readonly montage: MontageState
  readonly playing: boolean
  readonly playhead: number | null
}

export type Workshop = StillWorkshop | MotionWorkshop

export type WorkshopOf<K extends WorkshopKind> = K extends 'still'
  ? StillWorkshop
  : MotionWorkshop

/** Compile-time guard: motion-only fields unreachable on still */
export function assertMotion(w: Workshop): MotionWorkshop {
  if (w.kind !== 'motion') throw new Error('expected motion workshop')
  return w
}

// ---------------------------------------------------------------------------
// Chrome theme — orthogonal to workshops and export matte
// ---------------------------------------------------------------------------

export type ChromeTheme = 'light' | 'dark' | 'system'

export interface ChromeTokens {
  readonly ink: string
  readonly muted: string
  readonly line: string
  readonly paper: string
  readonly shadow: string
  readonly wash: string
  readonly rail: string
  readonly chromeHeight: string
}

export interface ChromeState {
  readonly preference: ChromeTheme
  readonly resolved: 'light' | 'dark'
  readonly tokens: ChromeTokens
}

/**
 * Stage paper for live Avatar only — third paint layer.
 * Export always uses BLANC via ouvreCycle; goldens use DEFAULT_PAPER.
 */
export type StagePaperPolicy = 'match-chrome' | 'canonical-light'

export interface ChromeOptions {
  readonly stagePaperPolicy: StagePaperPolicy
}

// ---------------------------------------------------------------------------
// Persistence keys — ledger owns mapping, callers never see raw names
// ---------------------------------------------------------------------------

export type LedgerStorageKey =
  | 'forme:still'
  | 'couleur:still'
  | 'expression:still'
  | 'fond:still'
  | 'fondCopy:still'
  | 'forme:motion'
  | 'couleur:motion'
  | 'expression:motion'
  | 'fond:motion'
  | 'fondCopy:motion'
  | 'cycles:motion'
  | 'chromeTheme'

// ---------------------------------------------------------------------------
// WorkshopLedger — deep module; single source of truth for both desks
// ---------------------------------------------------------------------------

export interface WorkshopLedger {
  readonly still: StillWorkshop
  readonly motion: MotionWorkshop
  readonly activeKind: WorkshopKind

  /** Read-only view by kind */
  get<K extends WorkshopKind>(kind: K): WorkshopOf<K>

  /** Atomic look write; persists namespaced key; never touches sibling workshop */
  patchLook(kind: WorkshopKind, patch: LookPatch): void

  patchBanner(kind: WorkshopKind, banner: Partial<BannerChoice>): void

  /** Motion only — stops playback if pose changes during play */
  setPose(pose: AnimationState): void

  setMontage(montage: MontageState): void

  setPlaying(playing: boolean): void

  setPlayhead(t: number | null): void

  /** Idempotent; updates ?desk= and activeKind */
  switchDesk(kind: WorkshopKind): void
}

export interface LedgerOptions {
  /** One-time migration from legacy singleton keys */
  readonly migrateLegacySingletons: boolean
}

export function createWorkshopLedger(options?: LedgerOptions): WorkshopLedger {
  throw new Error('not implemented')
}

export function readDeskFromQuery(search?: string): WorkshopKind {
  // TODO: parse ?desk=still|motion, default STILL
  throw new Error('not implemented')
}

export function writeDeskToQuery(kind: WorkshopKind): void {
  // TODO: history.replaceState preserving hash
  throw new Error('not implemented')
}

// ---------------------------------------------------------------------------
// Vue composables — thin shell surface
// ---------------------------------------------------------------------------

export interface DiptychContext {
  readonly ledger: WorkshopLedger
  readonly activeKind: { value: WorkshopKind }
  readonly chrome: ChromeState
}

export function useDiptych(): DiptychContext {
  throw new Error('not implemented')
}

export function provideDiptych(ctx: DiptychContext): void {
  throw new Error('not implemented')
}

export interface ChromeThemeControls {
  readonly theme: { value: ChromeTheme }
  readonly resolved: { value: 'light' | 'dark' }
  readonly stagePaper: { value: string }
  setTheme(next: ChromeTheme): void
}

export function useChromeTheme(): ChromeThemeControls {
  throw new Error('not implemented')
}

export function resolveChromeTheme(
  preference: ChromeTheme,
  systemDark: boolean,
): 'light' | 'dark' {
  throw new Error('not implemented')
}

export function tokensFor(resolved: 'light' | 'dark'): ChromeTokens {
  throw new Error('not implemented')
}

export function stagePaper(
  resolved: 'light' | 'dark',
  policy: StagePaperPolicy,
): string {
  throw new Error('not implemented')
}

export function applyChromeToDocument(state: ChromeState): void {
  // TODO: set data-chrome-theme, inject token custom properties on documentElement
  throw new Error('not implemented')
}

// ---------------------------------------------------------------------------
// Latch Rail — navigation UX component contract
// ---------------------------------------------------------------------------

export interface LatchGlyph {
  readonly shape: ShapeId
  readonly colour: ColorId
}

export interface LatchRailProps {
  kind: WorkshopKind
  ledger: WorkshopLedger
  chrome: ChromeState
}

export interface LatchRailEmits {
  'update:kind': [kind: WorkshopKind]
}

/** Mini SVG snapshot for inactive chamber — rendered off main stage */
export function latchGlyphFor(workshop: Workshop): LatchGlyph {
  throw new Error('not implemented')
}

// ---------------------------------------------------------------------------
// Desk shells — one mounted at a time via v-if
// ---------------------------------------------------------------------------

export interface DeskProps<K extends WorkshopKind> {
  workshop: WorkshopOf<K>
}

export interface StillExportPayload {
  action: Extract<ActionId, 'png' | 'svg'>
}

export interface MotionExportPayload {
  action: Extract<ActionId, 'gif' | 'mp4'> | 'banner-png' | 'banner-mp4'
  videoSource: VideoSourceKind
}

export interface ExportContext {
  readonly svg: SVGSVGElement | null
  readonly signal?: AbortSignal
  readonly onProgress?: (done: number, total: number) => void
}

// ---------------------------------------------------------------------------
// exportBridge — single export entry; hides payload assembly
// ---------------------------------------------------------------------------

export interface ExportResult {
  readonly filename: string
}

export async function exportWorkshop(
  workshop: Workshop,
  intent: ExportIntent,
  ctx: ExportContext,
): Promise<ExportResult> {
  // TODO: branch on workshop.kind + intent.kind
  // still → exporte(svg, format, Idle)
  // video → exporteMontage / bannerExport with workshop.look, BLANC paper
  throw new Error('not implemented')
}

export function stillIntent(format: StillFormat): ExportIntent {
  throw new Error('not implemented')
}

export function motionIntent(
  format: VideoFormat,
  source:
    | { source: 'pose'; state: AnimationState }
    | { source: 'cycle'; cycle: Cycle },
): ExportIntent {
  throw new Error('not implemented')
}

// ---------------------------------------------------------------------------
// Motion hash — video desk only; coexists with ?desk=
// ---------------------------------------------------------------------------

export function readMotionPoseFromHash(): AnimationState | null {
  throw new Error('not implemented')
}

export function writeMotionPoseToHash(pose: AnimationState, playing: boolean): string {
  throw new Error('not implemented')
}

export function bindMotionHash(ledger: WorkshopLedger): () => void {
  // TODO: watch pose/playing, listen hashchange; return dispose
  throw new Error('not implemented')
}

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------

export function mountDiptychStudio(selector: string): void {
  // TODO: createLedger, applyChrome, bind hash if motion, mount DiptychShell
  throw new Error('not implemented')
}

// ---------------------------------------------------------------------------
// Preview discipline — hover does not persist (preserves App.spec behaviour)
// ---------------------------------------------------------------------------

export interface PreviewOverlay {
  readonly shape: ShapeId | null
  readonly expression: ExpressionId | null
  readonly pose: AnimationState | null
}

export function effectiveLook(
  workshop: Workshop,
  preview: PreviewOverlay,
): LookBundle {
  throw new Error('not implemented')
}

export function effectivePose(
  workshop: MotionWorkshop,
  preview: PreviewOverlay,
): AnimationState {
  throw new Error('not implemented')
}

// ---------------------------------------------------------------------------
// Layout — data-desk attribute drives padding without Timeline on still
// ---------------------------------------------------------------------------

export type DeskLayout = 'still' | 'motion'

export function pagePaddingFor(desk: DeskLayout): { bottom: string } {
  throw new Error('not implemented')
}

// ---------------------------------------------------------------------------
// Export state UI (shared pattern from App.vue)
// ---------------------------------------------------------------------------

export interface ExportUiState {
  readonly etat: EtatExport
  readonly progress: number | null
}

export function createExportUiState(): {
  state: ExportUiState
  run<T>(fn: () => Promise<T>): Promise<T>
  cancel(): void
} {
  throw new Error('not implemented')
}
