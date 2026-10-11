/**
 * Candidate 3 — Split-flap desks.
 *
 * Presentation types for OutputDock. DeskKind, session.focusDesk, and
 * hrefForDesk stay the studio contract; this file does not fork them.
 * Bodies throw `not implemented` where a helper would live next to the
 * component. Vue keeps deriving views in a computed, as today.
 */

/** Existing union from `src/studio/types`. Do not fork. */
export type DeskKind = 'image' | 'video'

/** Existing from `src/engine`. Dock only needs the id to look up a hex. */
export type ColorId =
  | 'ink'
  | 'cream'
  | 'brown'
  | 'red'
  | 'orange'
  | 'amber'
  | 'green'
  | 'turquoise'
  | 'blue'
  | 'violet'
  | 'pink'
  | 'grey'

/** Which way the flap sits in the Solari window. Derived from session focus. */
export type FlapAttitude = 'dropped' | 'cocked'

/** Living glyph. Polaroid is still; gate scrubs only while dropped. */
export type FlapGlyph = 'polaroid' | 'gate'

/**
 * One window on the board. Built in OutputDock from props + i18n.
 * Not stored. Not a second focus.
 */
export interface DeskFlapView {
  readonly kind: DeskKind
  readonly attitude: FlapAttitude
  readonly glyph: FlapGlyph
  readonly label: string
  readonly aria: string
  readonly hint: string
  readonly tint: string
  readonly href: string
}

/** Public component contract. Identical to today’s OutputDock. */
export interface OutputDockProps {
  readonly focus: DeskKind
  readonly imageColour: ColorId
  readonly videoColour: ColorId
  readonly videoDuration: number
}

export type OutputDockEmits = {
  focus: [kind: DeskKind]
}

export function flapAttitude(focus: DeskKind, kind: DeskKind): FlapAttitude {
  throw new Error('not implemented')
  // return focus === kind ? 'dropped' : 'cocked'
}

export function flapGlyph(kind: DeskKind): FlapGlyph {
  throw new Error('not implemented')
  // return kind === 'image' ? 'polaroid' : 'gate'
}

/**
 * Hex for the hinge lip. Caller already has ColorId per desk; this is the
 * existing COLOR_BY_ID lookup, not a new palette.
 */
export function tintHex(_id: ColorId): string {
  throw new Error('not implemented')
}
