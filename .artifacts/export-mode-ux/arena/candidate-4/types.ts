/**
 * Split-Flap Rail — candidate 4 view-model sketch.
 * Session API unchanged; types describe presentation layer only.
 */

import type { ColorId } from '../../../src/engine'
import type { DeskKind } from '../../../src/studio'

// ---------------------------------------------------------------------------
// Public props / emit — identical to production OutputDock
// ---------------------------------------------------------------------------

export interface OutputDockProps {
  focus: DeskKind
  imageColour: ColorId
  videoColour: ColorId
  videoDuration: number
}

export interface OutputDockEmits {
  focus: [kind: DeskKind]
}

// ---------------------------------------------------------------------------
// Per-desk view model (computed in OutputDock)
// ---------------------------------------------------------------------------

export interface DeskFlapViewModel {
  kind: DeskKind
  label: string
  aria: string
  hint: string
  tint: string
  href: string
  isForward: boolean
}

export type DeskFlapList = readonly [DeskFlapViewModel, DeskFlapViewModel]

// ---------------------------------------------------------------------------
// Flap presentation state — drives CSS classes only
// ---------------------------------------------------------------------------

export type FlapPose = 'forward' | 'edge'

export function flapPose(isForward: boolean): FlapPose {
  return isForward ? 'forward' : 'edge'
}

export function flapClassNames(vm: DeskFlapViewModel): readonly string[] {
  const pose = flapPose(vm.isForward)
  return ['flap', pose === 'forward' ? 'is-forward' : 'is-edge']
}

// ---------------------------------------------------------------------------
// Glyph contracts
// ---------------------------------------------------------------------------

export interface DeskGlyphProps {
  tint: string
  /** When true, motion glyph runs scrub animation (respect reduced-motion in CSS). */
  active: boolean
}

export type DeskGlyphComponent = 'DeskGlyphStill' | 'DeskGlyphMotion'

export function glyphForKind(kind: DeskKind): DeskGlyphComponent {
  return kind === 'image' ? 'DeskGlyphStill' : 'DeskGlyphMotion'
}

// ---------------------------------------------------------------------------
// Rail layout mode — responsive hinge axis
// ---------------------------------------------------------------------------

export type FlapHingeAxis = 'vertical' | 'horizontal'

/** Desktop topbar hinges on Y; mobile bottom bar hinges on X. */
export function hingeAxisForViewport(widthPx: number): FlapHingeAxis {
  return widthPx <= 640 ? 'horizontal' : 'vertical'
}

// ---------------------------------------------------------------------------
// Factory stub — not implemented in arena artifact
// ---------------------------------------------------------------------------

export function buildDeskFlaps(_props: OutputDockProps): DeskFlapList {
  throw new Error('not implemented — wire to desks computed + hrefForDesk + i18n in OutputDock.vue')
}
