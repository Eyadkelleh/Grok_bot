/**
 * Candidate 1 — "Still Plate ↔ Running Strip".
 *
 * View types for the redesigned `OutputDock`. Everything here is presentation:
 * it describes how a desk is *drawn*, never what a desk *is*. `DeskKind` and the
 * session API are imported, not extended — the whole point of the candidate is
 * that the public surface does not move.
 *
 * In the real component these live inline in `<script setup>`; they are spelled
 * out here so the arena can compare interface depth across candidates.
 */

import type { ColorId } from '../../../../src/engine'
import type { DeskKind } from '../../../../src/studio'

/* -------------------------------------------------------------------------- */
/* Public surface — unchanged from today                                       */
/* -------------------------------------------------------------------------- */

/** Exactly the props `App.vue` passes today. No additions. */
export interface OutputDockProps {
  readonly focus: DeskKind
  readonly imageColour: ColorId
  readonly videoColour: ColorId
  /** Seconds. Rendered through `secondesCourtes`, only on the video carrier. */
  readonly videoDuration: number
}

/** Exactly the emit today. `studio.focusDesk` stays the sole writer of focus. */
export interface OutputDockEmits {
  (event: 'focus', kind: DeskKind): void
}

/* -------------------------------------------------------------------------- */
/* Presentation types — new, and private to the component                      */
/* -------------------------------------------------------------------------- */

/**
 * Which physical carrier a desk is drawn as.
 *
 * This is the candidate's core idea: the two desks are not two slots of one
 * control, they are two different objects threaded through the same gate. The
 * carrier decides both the static glyph (frame count, sprockets vs crop marks)
 * and which engage choreography runs on selection.
 *
 * `plate` — one wide exposed frame, crop marks, exposure bloom.
 * `run`   — five narrow frames, sprocket perforations, transport + playhead.
 */
export type Carrier = 'plate' | 'run'

/**
 * How many frames a carrier draws. Static per desk and never animated away, so
 * an unfocused desk still says what it is. Kept as a literal union rather than
 * `number` because these are the only two drawings that have been designed.
 */
export type FrameCount = 1 | 5

/** One desk, fully resolved for rendering. Built by `deskPlates` below. */
export interface DeskPlate {
  readonly kind: DeskKind
  /** Locale `dock.image` / `dock.video`. Must stay in the anchor's text. */
  readonly label: string
  /** Locale `dock.imageAria` / `dock.videoAria`. */
  readonly aria: string
  /** Locale `dock.imageHint` / `dock.videoHint`. Formats only — no duration. */
  readonly hint: string
  /**
   * Pre-formatted short duration, or `null` for desks that have no time.
   * Split out of `hint` so the chip can collapse when the desk is unfocused;
   * the string itself still comes from `secondesCourtes`, not from local policy.
   */
  readonly duration: string | null
  /** Resolved hex for the desk's current colour. Feeds the `--tint` custom property. */
  readonly tint: string
  readonly carrier: Carrier
  readonly frames: FrameCount
}

/**
 * Ordered image-then-video. The tuple type is load-bearing: DOM order inside the
 * dock is an invariant (`App.spec` reads `[data-desk="image"]` first, and the
 * dock must precede `#studio`), so the array is not allowed to be re-sorted.
 */
export type DeskPlates = readonly [image: DeskPlate, video: DeskPlate]

/**
 * The `desks` computed, restated. Pure: locale + props in, drawings out. No
 * store reads, no `hrefForDesk` call (the template does that), no format policy.
 */
export declare function deskPlates(props: OutputDockProps): DeskPlates

/* -------------------------------------------------------------------------- */
/* Motion contract — documented as constants, not as an API                    */
/* -------------------------------------------------------------------------- */

/**
 * The timings the two engage choreographies are built from. These exist as CSS
 * custom properties on `.gate` in the real component; typed here so the arena
 * can read the motion budget without opening the prototype.
 *
 * Every one of these is nulled under `prefers-reduced-motion: reduce`. No state
 * in this control is communicated by motion alone.
 */
export interface GateMotion {
  /** Carrier width handoff (`flex-grow`). */
  readonly engageMs: 320
  /** Reverse of the above, deliberately faster. */
  readonly releaseMs: 180
  /** Crop marks / sprocket punch-in, per-element stagger. */
  readonly staggerMs: 40
  /** Sprocket reveal sweep (`clip-path`), image highlight sweep. */
  readonly threadMs: 420
  /** Film transport scroll (`background-position-x`), infinite. */
  readonly transportMs: 900
  /** Playhead sweep across the run, infinite. */
  readonly playheadMs: 1600
  /** One-shot housing translateX settle on any switch. */
  readonly advanceMs: 320
  readonly ease: 'cubic-bezier(0.2, 0.9, 0.2, 1)'
}

export declare const GATE_MOTION: GateMotion

/* -------------------------------------------------------------------------- */
/* Not implemented — deliberately out of scope                                 */
/* -------------------------------------------------------------------------- */

/**
 * Deriving the format hint from `desk.delivery` instead of the i18n key.
 * HOW.md says hints *may* derive from delivery formats later, and that today's
 * keys stand. Stubbed to mark the seam without opening it: taking this would add
 * a `formats` prop and pull delivery policy into the chooser.
 *
 * @throws not implemented
 */
export declare function hintFromDelivery(kind: DeskKind): string

/**
 * Binding the transport scroll and playhead to real playback state.
 * Rejected for v1 because it needs a `playing` prop, which widens the public
 * surface to sync decorative motion. The loop means "moving-image desk", not
 * "playback running".
 *
 * @throws not implemented
 */
export declare function transportPaused(kind: DeskKind): boolean
