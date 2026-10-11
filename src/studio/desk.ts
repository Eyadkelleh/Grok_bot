/**
 * One desk: the look, the pose, the artifact, and (on video) the montage and
 * its transport.
 *
 * The pose stomp that forced `stop-playing` on every picker click is gone by
 * construction. While the transport runs, the rendered pose is *derived* from
 * the playhead and nothing writes `config.pose`, so shape and pose arrive from
 * independent sources and changing one mid-playback cannot clobber the other.
 */

import { computed, ref, type ComputedRef } from 'vue'
import {
  activeCycleOf,
  applyMontageEdit,
  blockAt,
  totalDuration,
  type Cycle,
  type Montage,
  type MontageEdit,
} from '../engine'
import { Abandon } from '../ui/export'
import {
  offerableFormats,
  runDelivery,
  type DeliveryState,
  type DeliveryStatus,
  type FormatFor,
} from './delivery'
import type {
  BannerCopy,
  ConfigFor,
  DeskFrame,
  DeskKind,
  LookFacet,
  PickerBand,
} from './types'

const CONFIRMATION_MS = 1800

export interface DeskBase<K extends DeskKind> {
  readonly kind: K
  readonly config: ComputedRef<ConfigFor<K>>
  readonly frame: ComputedRef<DeskFrame>
  readonly band: ComputedRef<PickerBand>
  readonly delivery: ComputedRef<DeliveryStatus<K>>
  preview(facet: LookFacet | null): void
  commit(facet: LookFacet): void
  openBand(band: PickerBand): void
  deliver(format: FormatFor<K>): Promise<void>
  cancelDelivery(): void
  /** Returns the detach function. Keyed to this desk, so a stale image stage
   *  can never serve another desk's delivery. */
  attachStage(getSvg: () => SVGSVGElement | null): () => void
  dispose(): void
}

export interface ImageDesk extends DeskBase<'image'> {}

export interface Transport {
  readonly playing: ComputedRef<boolean>
  readonly at: ComputedRef<number>
  readonly total: ComputedRef<number>
  play(): void
  pause(): void
  toggle(): void
  seek(seconds: number): void
}

export interface VideoDesk extends DeskBase<'video'> {
  readonly montage: ComputedRef<Montage>
  readonly activeCycle: ComputedRef<Cycle>
  readonly transport: Transport
  editMontage(edit: MontageEdit): void
}

export type DeskFor<K extends DeskKind> = K extends 'image' ? ImageDesk : VideoDesk

export interface DeskPort<K extends DeskKind> {
  readonly config: ComputedRef<ConfigFor<K>>
  readonly bannerCopy: ComputedRef<BannerCopy>
  write(next: ConfigFor<K>): void
}

function withFacet<K extends DeskKind>(config: ConfigFor<K>, facet: LookFacet): ConfigFor<K> {
  if (facet.field === 'pose') return { ...config, pose: facet.value }
  return { ...config, look: { ...config.look, [facet.field]: facet.value } }
}

export function createDesk<K extends DeskKind>(kind: K, port: DeskPort<K>): DeskFor<K> {
  const peek = ref<LookFacet | null>(null)
  const openPanel = ref<PickerBand>(null)
  const state = ref<DeliveryState>('ready')
  const progress = ref<number | null>(null)
  let getStageSvg: (() => SVGSVGElement | null) | null = null
  let abort: AbortController | undefined
  let confirmation: ReturnType<typeof setTimeout> | undefined

  const playing = ref(false)
  const rawAt = ref(0)
  let raf = 0
  let originWall = 0
  let originClock = 0

  const montage = computed(() => (port.config.value as ConfigFor<'video'>).montage)
  const activeCycle = computed(() => activeCycleOf(montage.value))
  const total = computed(() => (kind === 'video' ? totalDuration(activeCycle.value.blocks) : 0))
  const at = computed(() => {
    const span = total.value
    if (span <= 0) return 0
    return ((rawAt.value % span) + span) % span
  })

  function stopClock() {
    cancelAnimationFrame(raf)
    raf = 0
  }

  function loop(ts: number) {
    rawAt.value = originClock + (ts - originWall) / 1000
    raf = requestAnimationFrame(loop)
  }

  function startClock() {
    stopClock()
    originWall = performance.now()
    originClock = at.value
    raf = requestAnimationFrame(loop)
  }

  const transport: Transport = {
    playing: computed(() => playing.value),
    at,
    total,
    play() {
      if (playing.value) return
      playing.value = true
      startClock()
    },
    pause() {
      if (!playing.value) return
      playing.value = false
      stopClock()
    },
    toggle() {
      if (playing.value) transport.pause()
      else transport.play()
    },
    seek(seconds) {
      originClock = seconds
      originWall = performance.now()
      rawAt.value = seconds
    },
  }

  const frame = computed<DeskFrame>(() => {
    const config = port.config.value
    const shown = peek.value
    const live = kind === 'video' && playing.value
    const blocks = live ? activeCycle.value.blocks : []
    return {
      shape: shown?.field === 'shape' ? shown.value : config.look.shape,
      colour: shown?.field === 'colour' ? shown.value : config.look.colour,
      expression: shown?.field === 'expression' ? shown.value : config.look.expression,
      banner: shown?.field === 'banner' ? shown.value : config.look.banner,
      pose: live
        ? (blocks[blockAt(blocks, at.value).index]?.state ?? config.pose)
        : shown?.field === 'pose'
          ? shown.value
          : config.pose,
      playhead: live ? at.value : null,
      blocks,
    }
  })

  const delivery = computed<DeliveryStatus<K>>(() => ({
    state: state.value,
    progress: progress.value,
    formats: offerableFormats(kind, port.config.value),
  }))

  function settle(next: DeliveryState) {
    state.value = next
    clearTimeout(confirmation)
    if (next !== 'ready') {
      confirmation = setTimeout(() => (state.value = 'ready'), CONFIRMATION_MS)
    }
  }

  return {
    kind,
    config: port.config,
    frame,
    band: computed(() => openPanel.value),
    delivery,

    preview(facet: LookFacet | null) {
      if (kind === 'video' && playing.value && facet?.field === 'pose') return
      peek.value = facet
    },

    commit(facet: LookFacet) {
      peek.value = null
      if (facet.field === 'pose' && kind === 'video') transport.pause()
      port.write(withFacet(port.config.value, facet))
    },

    openBand(next: PickerBand) {
      peek.value = null
      openPanel.value = openPanel.value === next ? null : next
    },

    async deliver(format: FormatFor<K>) {
      if (state.value === 'busy') return
      abort?.abort()
      abort = new AbortController()
      clearTimeout(confirmation)
      progress.value = format === 'png' || format === 'svg' ? null : 0
      state.value = 'busy'
      try {
        await runDelivery(kind, format, port.config.value, port.bannerCopy.value, getStageSvg, {
          onProgress: (done, span) => {
            progress.value = span > 0 ? Math.min(100, Math.round((100 * done) / span)) : 0
          },
          signal: abort.signal,
        })
        settle('done')
      } catch (err) {
        settle(err instanceof Abandon ? 'ready' : 'error')
      } finally {
        progress.value = null
        abort = undefined
      }
    },

    cancelDelivery() {
      abort?.abort()
    },

    attachStage(getSvg: () => SVGSVGElement | null) {
      getStageSvg = getSvg
      return () => {
        if (getStageSvg === getSvg) getStageSvg = null
      }
    },

    dispose() {
      stopClock()
      clearTimeout(confirmation)
      abort?.abort()
    },

    montage,
    activeCycle,
    transport,

    editMontage(edit: MontageEdit) {
      const config = port.config.value as ConfigFor<'video'>
      const next = applyMontageEdit(config.montage, edit)
      if (next === config.montage) return
      if (next.activeId !== config.montage.activeId) {
        transport.pause()
        transport.seek(0)
      }
      port.write({ ...config, montage: next } as ConfigFor<K>)
    },
  } as unknown as DeskFor<K>
}
