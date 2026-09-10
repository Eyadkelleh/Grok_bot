/**
 * Naming authority for Stage verbs.
 *
 * One row owns the English label key, the picker band, the `data-mode` hook,
 * the rail slot, and the picker peek attribute. Stage must not restate these
 * mappings as conditionals.
 */

import type { Cle } from '../i18n'
import type { PickerBand } from './types'

export type VerbId = Exclude<PickerBand, null>
export type VerbDataMode = 'shape' | 'expression' | 'colour' | 'state'
export type PeekAttr = 'data-shape' | 'data-expression' | 'data-colour' | 'data-state'

export interface VerbSpec {
  id: VerbId
  dataMode: VerbDataMode
  labelKey: Cle
  railIndex: 0 | 1 | 2 | 3
  peekAttr: PeekAttr
}

export const VERBS: Record<VerbId, VerbSpec> = {
  shape: {
    id: 'shape',
    dataMode: 'shape',
    labelKey: 'studio.shape',
    railIndex: 0,
    peekAttr: 'data-shape',
  },
  expression: {
    id: 'expression',
    dataMode: 'expression',
    labelKey: 'studio.face',
    railIndex: 1,
    peekAttr: 'data-expression',
  },
  colour: {
    id: 'colour',
    dataMode: 'colour',
    labelKey: 'studio.aura',
    railIndex: 2,
    peekAttr: 'data-colour',
  },
  pose: {
    id: 'pose',
    dataMode: 'state',
    labelKey: 'studio.motion',
    railIndex: 3,
    peekAttr: 'data-state',
  },
}
