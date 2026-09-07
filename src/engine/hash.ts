import { ANIMATION_STATES, type AnimationState } from './states'

/** Shareable slugs, matching bloub (`#etat=idle`, `#etat=wide`, `#etat=notify`). */
export const STATE_SLUGS = {
  Idle: 'idle',
  Thinking: 'thinking',
  Wink: 'wink',
  WideEyes: 'wide',
  Alert: 'alert',
  Notification: 'notify',
  Exclamation: 'exclaim',
  Sleep: 'sleep',
  Egg: 'egg',
  Hexagon: 'hexagon',
  Play: 'play',
  Orbit: 'orbit',
  Burst: 'burst',
  Comet: 'comet',
} as const satisfies Record<AnimationState, string>

export type StateSlug = (typeof STATE_SLUGS)[AnimationState]

const BY_SLUG = new Map<string, AnimationState>(
  ANIMATION_STATES.flatMap((id) => {
    const slug = STATE_SLUGS[id]
    return [
      [slug, id],
      [id.toLowerCase(), id],
      [id, id],
    ]
  }),
)

export interface HashEtat {
  state: AnimationState
  named: boolean
  playing: boolean
}

export function slugOf(state: AnimationState): StateSlug {
  return STATE_SLUGS[state]
}

export function stateFromSlug(value: string | null | undefined): AnimationState | null {
  if (!value) return null
  return BY_SLUG.get(value) ?? BY_SLUG.get(value.toLowerCase()) ?? null
}

export function fragmentPour(state: AnimationState, playing: boolean): string {
  return `#etat=${slugOf(state)}${playing ? '' : '&stop'}`
}

export function lireHash(hash = location.hash): HashEtat {
  const params = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash)
  const state = stateFromSlug(params.get('etat'))
  return {
    state: state ?? 'Idle',
    named: state !== null,
    playing: !params.has('stop'),
  }
}

export function ecrireHash(state: AnimationState, playing: boolean): string {
  const next = fragmentPour(state, playing)
  if (location.hash === next) return next
  history.replaceState(null, '', next)
  return next
}
