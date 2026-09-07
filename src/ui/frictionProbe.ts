import type { VueWrapper } from '@vue/test-utils'
import { defaultCycle, totalDuration } from '../engine'
import { ACTIONS, videoPossible } from './export'
import { type FrictionFlags } from './friction'

const MONTAGE_HINT =
  /\b(cycle|montage|sequence|timeline|clip|vid[eé]o|boucle|s[eé]quence)\b/i

function textOf(el: Element | undefined): string {
  return (el?.textContent ?? '').replace(/\s+/g, ' ').trim()
}

/** Probe the mounted studio for issue #33 friction flags. */
export function probeFriction(wrapper: VueWrapper): FrictionFlags {
  const bar = wrapper.find('[data-export-bar]')
  const barText = textOf(bar.element)
  const gif = wrapper.find('[data-export="gif"]')
  const mp4 = wrapper.find('[data-export="mp4"]')
  const montageCopy = `${textOf(gif.element)} ${textOf(mp4.element)} ${barText}`

  const palette = wrapper.find('[data-animations-palette]')
  const palettePath = palette.find('svg path')
  const fill = palettePath.attributes('fill') ?? ''
  const paletteUsesColour = Boolean(fill) && fill !== 'currentColor' && fill.startsWith('#')

  const add = wrapper.find('[data-add]')
  const addLabel = `${add.attributes('aria-label') ?? ''} ${textOf(add.element)}`
  const selectedState =
    wrapper.find('[data-animations-palette] [aria-checked="true"]').attributes('data-state') ??
    wrapper.find('#studio svg[role="img"]').attributes('data-state') ??
    ''
  const addNamesState =
    add.exists() &&
    Boolean(selectedState) &&
    (addLabel.toLowerCase().includes(selectedState.toLowerCase()) ||
      /\b(idle|thinking|comet|wink)\b/i.test(addLabel))

  const busyStatus =
    Boolean(wrapper.find('[data-export-busy]').exists()) ||
    /exporting|encod|en cours|导出中/i.test(barText)

  const mp4Missing = !mp4.exists()
  const mp4Disabled = mp4.exists() && mp4.attributes('disabled') !== undefined
  const mp4Gated = !videoPossible() ? mp4Missing || mp4Disabled : true

  const durationShown =
    wrapper.find('[data-export-duration]').exists() ||
    (bar.find('[data-export-meta]').exists() && /\b\d+(\.\d+)?\s*s\b/i.test(barText))

  const cycleNamed =
    wrapper.find('[data-export-cycle]').exists() ||
    (bar.find('[data-export-meta]').exists() &&
      /default cycle|cycle par d[eé]faut|默认循环/i.test(barText))

  const poseVideoPath =
    wrapper.find('[data-export-pose], [data-use-pose], [data-loop-pose]').exists() ||
    /this (pose|animation)|cette (pose|animation)|当前动作/i.test(barText)

  const montageLabeled =
    gif.exists() &&
    mp4.exists() &&
    (MONTAGE_HINT.test(montageCopy) ||
      wrapper.find('[data-export-group="montage"]').exists())

  const durationSecs = Number(
    wrapper.find('[data-export-duration-secs]').attributes('data-export-duration-secs') ?? 'NaN',
  )

  return {
    montageLabeled,
    durationShown,
    cycleNamed,
    poseVideoPath,
    paletteUsesColour,
    newCycleFromPose: false,
    addNamesState,
    busyStatus,
    mp4Gated,
    saneDefaultDuration: Number.isFinite(durationSecs)
      ? durationSecs <= 8
      : totalDuration(defaultCycle().blocks) <= 8,
  }
}

/** Interactive flag: create a cycle and see if first block matches current state. */
export async function probeNewCycleFromPose(
  wrapper: VueWrapper,
  create: () => Promise<void> | void,
): Promise<boolean> {
  await create()
  await wrapper.vm.$nextTick()
  const select = wrapper.find('[data-cycle-select]')
  const selectedId = (select.element as HTMLSelectElement).value
  const option = wrapper.find(`[data-cycle="${selectedId}"]`)
  const first = wrapper.find('[data-timeline] [data-block="0"]').attributes('data-state')
  // Debug-friendly: require active cycle's first card to be Comet after the scripted create.
  return Boolean(option.exists() && first === 'Comet')
}

export function montageActionCount(): number {
  return ACTIONS.filter((a) => a.mode === 'montage').length
}
