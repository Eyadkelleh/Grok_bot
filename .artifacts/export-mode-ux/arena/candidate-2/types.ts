/**
 * Studio Shuttle keeps the production contract unchanged.
 * These types document the presentation model proposed for OutputDock.vue.
 */

import type { ColorId } from '../../../../src/engine'
import type { DeskKind } from '../../../../src/studio'

export interface OutputDockProps {
  focus: DeskKind
  imageColour: ColorId
  videoColour: ColorId
  videoDuration: number
}

export interface OutputDockEmits {
  focus: [kind: DeskKind]
}

export interface DeskStopViewModel {
  kind: DeskKind
  label: string
  aria: string
  hint: string
  tint: string
  glyph: 'aperture' | 'filmstrip'
}

/**
 * Presentation is derived from props. It does not own focus, write the URL,
 * or decide which delivery formats belong to a desk.
 */
export function buildDeskStops(_props: OutputDockProps): readonly DeskStopViewModel[] {
  throw new Error('not implemented')
}
