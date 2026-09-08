import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '../App.vue'
import ExportBar from '../components/ExportBar.vue'
import { rechargerApparence } from '../customise'
import { rechargerLangue, langue } from '../i18n'
import en from '../i18n/locales/en'
import { FRICTION_VERSION, maxFriction, scoreFriction } from '../ui/friction'
import {
  probeBusyFriction,
  probeFriction,
  probeNewCycleFromPose,
  probeSkinHonesty,
} from '../ui/frictionProbe'

describe('video friction harness (issue #33)', () => {
  beforeEach(() => {
    history.replaceState(null, '', '/')
    window.localStorage.clear()
    rechargerLangue()
    rechargerApparence()
    langue.value = 'en'
  })

  it('emits a stable friction score for the frozen checklist', async () => {
    const wrapper = mount(App)
    await flushPromises()

    const flags = probeFriction(wrapper)
    flags.newCycleFromPose = await probeNewCycleFromPose(wrapper, async () => {
      await wrapper.get('[data-animations-palette] [data-state="Comet"]').trigger('click')
      await flushPromises()
      await wrapper.get('[data-cycle-new]').trigger('click')
      await flushPromises()
      await wrapper.get('[data-cycle-form]').trigger('submit')
      await flushPromises()
    })
    flags.skinHonesty = await probeSkinHonesty(wrapper, async () => {
      await wrapper.get('[data-animations-palette] [data-state="Comet"]').trigger('click')
      await flushPromises()
    })

    const busy = mount(ExportBar, {
      props: {
        etat: 'occupe',
        pose: 'Idle',
        cycleName: en.cycles.defaultName,
        cycleDuration: 2,
        cycleBlockCount: 1,
        progress: 40,
      },
    })
    Object.assign(flags, probeBusyFriction(busy))
    busy.unmount()

    const score = scoreFriction(flags)
    expect(flags.catalogDefaultShort).toBe(true)
    expect(score).toBe(0)
    expect(score).toBeLessThanOrEqual(maxFriction())

    // eslint-disable-next-line no-console
    console.log(
      JSON.stringify({
        frictionVersion: FRICTION_VERSION,
        score,
        max: maxFriction(),
        flags,
      }),
    )
  })
})
