import type { VueWrapper } from '@vue/test-utils'
import { defaultCycle, totalDuration } from '../engine'
import { ACTIONS, videoPossible } from './export'
import { type FrictionFlags } from './friction'

const MONTAGE_HINT =
  /\b(cycle|montage|sequence|timeline|clip|vid[eé]o|boucle|s[eé]quence)\b/i

const VIDEO_TAGLINE = /(?:\b(?:video|vid[eé]o|gif|mp4|clip)\b|视频)/i

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
      /default cycle|cycle par d[eé]faut|默认循环|默认序列/i.test(barText))

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

  const tagline = textOf(wrapper.find('.tagline').element)

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
    taglineMentionsVideo: VIDEO_TAGLINE.test(tagline),
    catalogDefaultShort: totalDuration(defaultCycle().blocks) <= 8,
    exportProgress: false,
    exportCancel: false,
    skinHonesty: false,
  }
}

/** Busy-state flags need an ExportBar mounted with etat=occupe. */
export function probeBusyFriction(
  wrapper: VueWrapper,
): Pick<FrictionFlags, 'exportProgress' | 'exportCancel' | 'busyStatus'> {
  return {
    busyStatus:
      wrapper.find('[data-export-busy]').exists() ||
      /exporting|encod|en cours|导出中/i.test(textOf(wrapper.element)),
    exportProgress:
      wrapper.find('[data-export-progress]').exists() ||
      /\d+\s*%/.test(textOf(wrapper.find('[data-export-status]').element)),
    exportCancel: wrapper.find('[data-export-cancel]').exists(),
  }
}

/** After selecting a non-face pose, the studio must warn about limited skin. */
export async function probeSkinHonesty(
  wrapper: VueWrapper,
  pickNonFace: () => Promise<void> | void,
): Promise<boolean> {
  await pickNonFace()
  await wrapper.vm.$nextTick()
  return wrapper.find('[data-skin-limited]').exists()
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
  return Boolean(option.exists() && first === 'Comet')
}

export function montageActionCount(): number {
  return ACTIONS.filter((a) => a.mode === 'montage').length
}
