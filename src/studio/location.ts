/**
 * The whole URL surface, one owner, one writer.
 *
 * Desk focus lives in the query (`?desk=video`) and the pose share link keeps
 * the fragment it has always had (`#etat=orbit&stop`), so old links still
 * resolve and neither half can clobber the other.
 */

import { fragmentPour, lireHash, type AnimationState } from '../engine'
import { isDeskKind, type DeskKind } from './types'

export interface LocationState {
  readonly focus: DeskKind
  readonly pose: AnimationState
  readonly playing: boolean
}

export interface LocationRead {
  readonly focus: DeskKind | null
  readonly pose: AnimationState | null
  readonly playing: boolean
}

export const DESK_PARAM = 'desk'

export function readLocation(href = location.href): LocationRead {
  const url = new URL(href)
  const desk = url.searchParams.get(DESK_PARAM)
  const etat = lireHash(url.hash)
  return {
    focus: isDeskKind(desk) ? desk : null,
    pose: etat.named ? etat.state : null,
    playing: etat.playing,
  }
}

/** Returns the fragment-and-query string written, so the session can ignore its own echo. */
export function writeLocation(state: LocationState): string {
  const url = new URL(location.href)
  url.searchParams.set(DESK_PARAM, state.focus)
  url.hash = fragmentPour(state.pose, state.playing)
  const next = `${url.pathname}${url.search}${url.hash}`
  if (`${location.pathname}${location.search}${location.hash}` !== next) {
    history.replaceState(null, '', next)
  }
  return next
}

/** The dock renders real links; this is the href each destination points at. */
export function hrefForDesk(kind: DeskKind, href = location.href): string {
  const url = new URL(href)
  url.searchParams.set(DESK_PARAM, kind)
  return `${url.pathname}${url.search}${url.hash}`
}
