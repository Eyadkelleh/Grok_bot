import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '../App.vue'
import ExportBar from '../components/ExportBar.vue'
import { rechargerApparence } from '../customise'
import { rechargerLangue, langue } from '../i18n'
import en from '../i18n/locales/en'
import { FRICTION_VERSION, maxFriction, scoreFriction } from '../ui/friction'
import { probeFriction, probeNewCycleFromPose } from '../ui/frictionProbe'

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

    const busy = mount(ExportBar, {
      props: {
        etat: 'occupe',
        pose: 'Idle',
        cycleName: en.cycles.defaultName,
        cycleDuration: 28,
        cycleBlockCount: 14,
      },
    })
    flags.busyStatus = busy.find('[data-export-busy]').exists()
    busy.unmount()

    const score = scoreFriction(flags)
    // Baseline on origin/main was 18. Stop predicate met at 0.
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
