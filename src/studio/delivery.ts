/**
 * Format availability policy and export payload assembly. Private to `desk.ts`:
 * this is what keeps the old ninety-line `surExport` switch out of every
 * component, and there is no `paper` parameter anywhere on this path because
 * the delivery matte is theme-independent by construction.
 */

import { activeCycleOf, makeBlock, POSE_HOLD, type AnimationState } from '../engine'
import { nomDeCycle } from '../i18n'
import { exportBannerMontage, exportBannerStill } from '../ui/bannerExport'
import { exporte, exporteMontage, type ReglagesBot } from '../ui/capture'
import { videoPossible } from '../ui/export'
import type { BannerCopy, ConfigFor, DeskKind } from './types'

export type FormatFor<K extends DeskKind> = {
  image: 'png' | 'svg' | 'banner-png'
  video: 'gif' | 'mp4' | 'banner-mp4'
}[K]

export type DeliveryState = 'ready' | 'busy' | 'done' | 'error'

/**
 * `enabled: false` still gets rendered. A missing MP4 button reads as a missing
 * feature; a disabled one with a reason reads as a browser limitation.
 */
export interface DeliveryOffer<K extends DeskKind> {
  readonly format: FormatFor<K>
  readonly enabled: boolean
}

export interface DeliveryStatus<K extends DeskKind> {
  readonly state: DeliveryState
  /** 0 to 100 for framed formats, null for one-shot stills. */
  readonly progress: number | null
  /** Offered right now, so the export bar carries no availability policy. */
  readonly formats: readonly DeliveryOffer<K>[]
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

export function offerableFormats<K extends DeskKind>(
  kind: K,
  config: ConfigFor<K>,
): readonly DeliveryOffer<K>[] {
  const plate = config.look.banner !== null
  const offer = (format: string, enabled = true) =>
    ({ format, enabled }) as DeliveryOffer<K>

  if (kind === 'image') {
    const out = [offer('png'), offer('svg')]
    if (plate) out.push(offer('banner-png'))
    return out
  }
  const mp4 = videoPossible()
  const out = [offer('mp4', mp4), offer('gif')]
  if (plate) out.push(offer('banner-mp4', mp4))
  return out
}

function reglagesOf(config: ConfigFor<DeskKind>): ReglagesBot {
  return {
    shape: config.look.shape,
    colour: config.look.colour,
    expression: config.look.expression,
  }
}

/**
 * A banner still renders the subject at t=0, and `poseCycle` opens on an Idle
 * lead-in, so feeding it the clip would print Idle whatever pose was picked.
 * One settled block of the pose is what a still wants.
 */
function stillBlocks(pose: AnimationState) {
  return [makeBlock(pose, POSE_HOLD)]
}

export async function runDelivery<K extends DeskKind>(
  kind: K,
  format: FormatFor<K>,
  config: ConfigFor<K>,
  bannerCopy: BannerCopy,
  getSvg: (() => SVGSVGElement | null) | null,
  options: DeliveryOptions = {},
): Promise<void> {
  const reglages = reglagesOf(config)

  if (format === 'png' || format === 'svg') {
    const svg = getSvg?.() ?? null
    if (!svg) throw new StageUnavailable()
    await exporte(svg, format, config.pose)
    return
  }

  if (format === 'banner-png') {
    await exportBannerStill(
      config.look.banner!,
      bannerCopy,
      reglages,
      stillBlocks(config.pose),
      config.pose,
    )
    return
  }

  const cycle = activeCycleOf((config as ConfigFor<'video'>).montage)
  const nom = nomDeCycle(cycle)

  if (format === 'banner-mp4') {
    await exportBannerMontage(
      config.look.banner!,
      bannerCopy,
      reglages,
      cycle,
      nom,
      options.onProgress,
      options.signal,
    )
    return
  }

  await exporteMontage(format, cycle, reglages, nom, options.onProgress, options.signal)
}
