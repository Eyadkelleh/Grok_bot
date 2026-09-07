import { mount, type VueWrapper } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import Timeline from '../components/Timeline.vue'
import { ANIMATION_STATES, type AnimationState } from '../engine'
import { langue, rechargerLangue, t } from '../i18n'
import { cle } from '../i18n/stockage'
import en from '../i18n/locales/en'
import fr from '../i18n/locales/fr'

describe('Timeline', () => {
  let wrapper: VueWrapper<InstanceType<typeof Timeline>> | undefined

  beforeEach(() => {
    wrapper?.unmount()
    window.localStorage.clear()
    rechargerLangue()
    langue.value = 'en'
  })

  function mountTimeline() {
    let vm: VueWrapper<InstanceType<typeof Timeline>>
    vm = mount(Timeline, {
      props: {
        state: 'Idle' as AnimationState,
        playing: false,
        'onUpdate:state': (state: AnimationState) => vm.setProps({ state }),
        'onUpdate:playing': (playing: boolean) => vm.setProps({ playing }),
      },
    })
    return vm
  }

  it('lays out the default montage on a bottom track', () => {
    wrapper = mountTimeline()
    expect(wrapper.find('[data-timeline]').exists()).toBe(true)
    expect(wrapper.findAll('[data-carte]')).toHaveLength(ANIMATION_STATES.length)
    expect(wrapper.get('[data-play]').attributes('aria-label')).toBe(en.timeline.play)
    expect(wrapper.get('[data-total]').text()).toBe('0:28')
    expect(wrapper.get('[data-cycle-select]').text()).toContain(en.cycles.defaultName)
  })

  it('plays, stops, and seeks a block onto the avatar state', async () => {
    wrapper = mountTimeline()
    await wrapper.get('[data-play]').trigger('click')
    expect(wrapper.get('[data-play]').attributes('aria-pressed')).toBe('true')
    expect(wrapper.get('[data-play]').attributes('aria-label')).toBe(en.timeline.pause)
    const playing = wrapper.emitted('update:playing')
    expect(playing?.[playing.length - 1]).toEqual([true])

    await wrapper.get('[data-play]').trigger('click')
    expect(wrapper.get('[data-play]').attributes('aria-pressed')).toBe('false')

    wrapper.vm.sample(2.1)
    await nextTick()
    const sampled = wrapper.emitted('update:state')
    expect(sampled?.[sampled.length - 1]).toEqual(['Thinking'])

    await wrapper.get('[data-block="1"] [data-carte]').trigger('click')
    const states = wrapper.emitted('update:state')
    expect(states?.[states.length - 1]).toEqual(['Thinking'])
  })

  it('adds, reorders, retimes, and removes blocks', async () => {
    wrapper = mountTimeline()
    await wrapper.get('[data-add]').trigger('click')
    expect(wrapper.findAll('[data-carte]')).toHaveLength(ANIMATION_STATES.length + 1)
    expect(wrapper.findAll('[data-block]')[ANIMATION_STATES.length]?.attributes('data-state')).toBe(
      'Idle',
    )

    await wrapper.get('[data-add-menu]').trigger('click')
    await wrapper.get('[data-pick="Comet"]').trigger('click')
    const cards = wrapper.findAll('[data-block]')
    expect(cards[cards.length - 1]?.attributes('data-state')).toBe('Comet')

    await wrapper.get('[data-block="0"] [data-move="right"]').trigger('click')
    expect(wrapper.get('[data-block="0"]').attributes('data-state')).toBe('Thinking')
    expect(wrapper.get('[data-block="1"]').attributes('data-state')).toBe('Idle')

    const duration = wrapper.get('[data-block="0"] [data-duration]')
    await duration.setValue('3')
    await duration.trigger('change')
    expect((wrapper.get('[data-block="0"] [data-duration]').element as HTMLInputElement).value).toBe(
      '3',
    )

    const before = wrapper.findAll('[data-carte]').length
    await wrapper.get('[data-block="0"] [data-remove]').trigger('click')
    expect(wrapper.findAll('[data-carte]')).toHaveLength(before - 1)
  })

  it('creates, renames, and removes named cycles', async () => {
    wrapper = mountTimeline()
    await wrapper.get('[data-cycle-new]').trigger('click')
    await wrapper.get('[data-cycle-name]').setValue('Night')
    await wrapper.get('[data-cycle-form]').trigger('submit')
    await nextTick()
    const select = wrapper.get('[data-cycle-select]').element as HTMLSelectElement
    expect(select.options).toHaveLength(2)
    expect(select.options[1]?.text).toBe('Night')
    expect(wrapper.findAll('[data-carte]')).toHaveLength(1)

    await wrapper.get('[data-cycle-rename]').trigger('click')
    await wrapper.get('[data-cycle-name]').setValue('Dawn')
    await wrapper.get('[data-cycle-form]').trigger('submit')
    expect((wrapper.get('[data-cycle-select]').element as HTMLSelectElement).selectedOptions[0]?.text).toBe(
      'Dawn',
    )

    await wrapper.get('[data-cycle-remove]').trigger('click')
    await wrapper.get('[data-cycle-confirm]').trigger('submit')
    expect((wrapper.get('[data-cycle-select]').element as HTMLSelectElement).options).toHaveLength(1)
    expect(wrapper.findAll('[data-carte]')).toHaveLength(ANIMATION_STATES.length)
  })

  it('persists the montage and restores it on a later visit', async () => {
    wrapper = mountTimeline()
    await wrapper.get('[data-add]').trigger('click')
    expect(window.localStorage.getItem(cle('cycles'))).toBeTruthy()
    wrapper.unmount()

    wrapper = mountTimeline()
    expect(wrapper.findAll('[data-carte]')).toHaveLength(ANIMATION_STATES.length + 1)
  })

  it('seeds a new cycle from the selected animation state', async () => {
    wrapper = mountTimeline()
    await wrapper.setProps({ state: 'Comet' as AnimationState })
    await wrapper.get('[data-cycle-new]').trigger('click')
    await wrapper.get('[data-cycle-form]').trigger('submit')
    expect(wrapper.findAll('[data-carte]')).toHaveLength(1)
    expect(wrapper.get('[data-block="0"]').attributes('data-state')).toBe('Comet')
  })

  it('translates transport copy', async () => {
    wrapper = mountTimeline()
    langue.value = 'fr'
    await nextTick()
    expect(wrapper.get('[data-play]').attributes('aria-label')).toBe(fr.timeline.play)
    expect(wrapper.get('[data-cycle-new]').text()).toBe(fr.cycles.menuNew)
    expect(t('cycles.defaultName')).toBe(fr.cycles.defaultName)
  })
})
