/**
 * Caller's usage comes first; these examples are the contract the types below serve.
 *
 * // AppShell.vue
 * const shell = useStudioShell()
 * shell.open('video')                  // updates ?studio=video and browser history
 * shell.theme.setPreference('dark')   // persists and applies document tokens
 *
 * // ImagePage.vue
 * const image = useStudioPage('image')
 * image.dispatch({ type: 'image/set-shape', shape: 'pebble' })
 * await image.export({ format: 'png' })
 *
 * // VideoPage.vue
 * const video = useStudioPage('video')
 * video.dispatch({ type: 'video/set-expression', expression: 'attentive' })
 * video.dispatch({ type: 'video/play' })
 * await video.export({ format: 'mp4', source: 'montage' })
 */

import type { DeepReadonly, Ref } from 'vue'
import type {
  AnimationState,
  Block,
  ColorId,
  Cycle,
  ExpressionId,
  ShapeId,
} from '../../../../src/engine'
import type { BannerId } from '../../../../src/ui/scene'

export type StudioArea = 'image' | 'video'
export type AppTheme = 'light' | 'dark'
export type ThemePreference = AppTheme | 'system'
export type HexColour = `#${string}`

export interface Look {
  readonly shape: ShapeId
  readonly colour: ColorId
  readonly expression: ExpressionId
}

export interface BannerText {
  readonly welcome: string
  readonly event1: string
  readonly event2: string
  readonly presentedBy: string
}

export interface Scene {
  readonly bannerId: BannerId | null
  readonly bannerCopy: BannerText
}

/** Image owns a complete look and pose. It cannot contain video montage state. */
export interface ImageWorkspaceState {
  readonly area: 'image'
  readonly revision: 1
  readonly look: Look
  readonly pose: AnimationState
  readonly scene: Scene
}

/** Video owns a separate complete look, pose, scene, and montage. */
export interface VideoWorkspaceState {
  readonly area: 'video'
  readonly revision: 1
  readonly look: Look
  readonly pose: AnimationState
  readonly scene: Scene
  readonly montage: {
    readonly cycles: readonly Cycle[]
    readonly activeCycleId: string
  }
}

export interface WorkspaceStateByArea {
  readonly image: ImageWorkspaceState
  readonly video: VideoWorkspaceState
}

export type ImageCommand =
  | { readonly type: 'image/set-shape'; readonly shape: ShapeId }
  | { readonly type: 'image/set-colour'; readonly colour: ColorId }
  | { readonly type: 'image/set-expression'; readonly expression: ExpressionId }
  | { readonly type: 'image/set-pose'; readonly pose: AnimationState }
  | { readonly type: 'image/set-scene'; readonly scene: Scene }
  | { readonly type: 'image/reset' }

export type VideoCommand =
  | { readonly type: 'video/set-shape'; readonly shape: ShapeId }
  | { readonly type: 'video/set-colour'; readonly colour: ColorId }
  | { readonly type: 'video/set-expression'; readonly expression: ExpressionId }
  | { readonly type: 'video/set-pose'; readonly pose: AnimationState }
  | { readonly type: 'video/set-scene'; readonly scene: Scene }
  | { readonly type: 'video/replace-montage'; readonly cycles: readonly Cycle[]; readonly activeCycleId: string }
  | { readonly type: 'video/select-cycle'; readonly cycleId: string }
  | { readonly type: 'video/play' }
  | { readonly type: 'video/pause' }
  | { readonly type: 'video/seek'; readonly seconds: number }
  | { readonly type: 'video/reset' }

export interface CommandByArea {
  readonly image: ImageCommand
  readonly video: VideoCommand
}

export interface ImageExportRequest {
  readonly format: 'png' | 'svg'
}

export interface VideoExportRequest {
  readonly format: 'gif' | 'mp4'
  readonly source: 'pose' | 'montage'
  readonly background?: 'blanc' | 'transparent'
}

export interface ExportRequestByArea {
  readonly image: ImageExportRequest
  readonly video: VideoExportRequest
}

export interface ExportReceipt {
  readonly fileName: string
  readonly cancelled: boolean
}

export interface PreviewFrame {
  readonly pose: AnimationState
  readonly playhead: number | null
  readonly blocks: readonly Block[]
  /** Theme-derived stage paint only; never forwarded to export or engine defaults. */
  readonly avatarPaper: HexColour
}

export interface StudioPage<K extends StudioArea> {
  readonly area: K
  readonly state: DeepReadonly<Ref<WorkspaceStateByArea[K]>>
  readonly preview: DeepReadonly<Ref<PreviewFrame>>
  dispatch(command: CommandByArea[K]): void
  export(request: ExportRequestByArea[K]): Promise<ExportReceipt>
  cancelExport(): void
}

export interface ThemePalette {
  readonly canvas: HexColour
  readonly surface: HexColour
  readonly ink: HexColour
  readonly muted: HexColour
  readonly line: HexColour
  readonly shadow: string
  readonly wash: string
  readonly avatarPaper: HexColour
}

/** The export matte is intentionally outside the app theme. */
export interface PaintLayers {
  readonly chrome: ThemePalette
  readonly avatarPaper: HexColour
  readonly exportMatte: '#ffffff'
}

export interface ThemeController {
  readonly preference: DeepReadonly<Ref<ThemePreference>>
  readonly resolved: DeepReadonly<Ref<AppTheme>>
  readonly palette: DeepReadonly<Ref<ThemePalette>>
  setPreference(preference: ThemePreference): void
}

export interface StudioShell {
  readonly activeArea: DeepReadonly<Ref<StudioArea>>
  readonly theme: ThemeController
  open(area: StudioArea): void
}

export function useStudioShell(): StudioShell {
  throw new Error('not implemented')
}

export function useStudioPage(area: 'image'): StudioPage<'image'>
export function useStudioPage(area: 'video'): StudioPage<'video'>
export function useStudioPage(
  area: StudioArea,
): StudioPage<'image'> | StudioPage<'video'> {
  throw new Error('not implemented')
}

/** Pure reducers replace exactly one area document; they never receive the sibling. */
export function reduceImage(
  current: ImageWorkspaceState,
  command: ImageCommand,
): ImageWorkspaceState {
  throw new Error('not implemented')
}

export function reduceVideo(
  current: VideoWorkspaceState,
  command: VideoCommand,
): VideoWorkspaceState {
  throw new Error('not implemented')
}

/** Internal persistence port. Each instance is permanently scoped to one storage key. */
export interface AreaRepository<K extends StudioArea> {
  load(): WorkspaceStateByArea[K]
  save(next: WorkspaceStateByArea[K]): void
}

export function createAreaRepository<K extends StudioArea>(
  area: K,
  storage: Pick<Storage, 'getItem' | 'setItem'>,
): AreaRepository<K> {
  throw new Error('not implemented')
}

export interface ExportAssembler {
  image(state: ImageWorkspaceState, request: ImageExportRequest): Promise<ExportReceipt>
  video(state: VideoWorkspaceState, request: VideoExportRequest): Promise<ExportReceipt>
  cancel(area: StudioArea): void
}

export function createExportAssembler(): ExportAssembler {
  throw new Error('not implemented')
}

export interface StudioLocation {
  read(): StudioArea
  push(area: StudioArea): void
  subscribe(listener: (area: StudioArea) => void): () => void
}

export function createQueryLocation(win: Window): StudioLocation {
  throw new Error('not implemented')
}

export function resolvePaintLayers(theme: AppTheme): PaintLayers {
  throw new Error('not implemented')
}
