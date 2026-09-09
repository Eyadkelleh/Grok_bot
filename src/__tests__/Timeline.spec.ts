import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import Timeline from '../components/Timeline.vue'
import { langue, rechargerLangue, t } from '../i18n'
import { cle } from '../i18n/stockage'
import en from '../i18n/locales/en'
import fr from '../i18n/locales/fr'
import { createStudioSession, type StudioSession } from '../studio'

describe('Timeline', () => {
  let wrapper: VueWrapper | undefined
  let session: StudioSession | undefined

  beforeEach(() => {
    window.localStorage.clear()
    history.replaceState(null, '', '/')
    rechargerLangue()
    langue.value = 'en'
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
    session?.dispose()
    session = undefined
  })

  function mountTimeline() {
    session = createStudioSession()
    wrapper = mount(Timeline, { props: { desk: session.video } })
    return { wrapper, desk: session.video }
  }

  it('lays out the default montage on a bottom track', () => {
    const { wrapper } = mountTimeline()
    expect(wrapper.find('[data-timeline]').exists()).toBe(true)
    expect(wrapper.findAll('[data-carte]')).toHaveLength(1)
    expect(wrapper.get('[data-play]').attributes('aria-label')).toBe(en.timeline.play)
    expect(wrapper.get('[data-total]').text()).toBe('0:02')
    expect(wrapper.get('[data-cycle-select]').text()).toContain(en.cycles.defaultName)
  })

  it('drives the desk transport and derives the shown pose from the playhead', async () => {
    const { wrapper, desk } = mountTimeline()
    desk.commit({ field: 'pose', value: 'Thinking' })
    await nextTick()
    await wrapper.get('[data-add]').trigger('click')

    await wrapper.get('[data-play]').trigger('click')
    expect(wrapper.get('[data-play]').attributes('aria-pressed')).toBe('true')
    expect(wrapper.get('[data-play]').attributes('aria-label')).toBe(en.timeline.pause)
    expect(desk.transport.playing.value).toBe(true)

    desk.transport.seek(2.1)
    await nextTick()
    expect(desk.frame.value.pose).toBe('Thinking')
    expect(wrapper.get('[data-clock]').text()).toBe('0:02')

    await wrapper.get('[data-block="0"] [data-carte]').trigger('click')
    expect(desk.transport.at.value).toBe(0)
    expect(desk.frame.value.pose).toBe('Idle')

    await wrapper.get('[data-play]').trigger('click')
    expect(desk.transport.playing.value).toBe(false)
  })

  it('never writes the desk pose while playing', async () => {
    const { wrapper, desk } = mountTimeline()
    desk.commit({ field: 'pose', value: 'Comet' })
    await nextTick()
    await wrapper.get('[data-add]').trigger('click')
    await wrapper.get('[data-play]').trigger('click')

    desk.transport.seek(0.5)
    await nextTick()

    expect(desk.frame.value.pose).toBe('Idle')
    expect(desk.config.value.pose).toBe('Comet')
  })

  it('adds, reorders, retimes, and removes blocks', async () => {
    const { wrapper, desk } = mountTimeline()
    desk.commit({ field: 'pose', value: 'Thinking' })
    await nextTick()
    await wrapper.get('[data-add]').trigger('click')
    expect(wrapper.findAll('[data-carte]')).toHaveLength(2)
    expect(wrapper.get('[data-block="1"]').attributes('data-state')).toBe('Thinking')

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
    const { wrapper } = mountTimeline()
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
    await nextTick()
    expect(
      (wrapper.get('[data-cycle-select]').element as HTMLSelectElement).selectedOptions[0]?.text,
    ).toBe('Dawn')

    await wrapper.get('[data-cycle-remove]').trigger('click')
    await wrapper.get('[data-cycle-confirm]').trigger('submit')
    await nextTick()
    expect((wrapper.get('[data-cycle-select]').element as HTMLSelectElement).options).toHaveLength(1)
    expect(wrapper.findAll('[data-carte]')).toHaveLength(1)
  })

  it('persists the montage under the studio document and restores it on a later visit', async () => {
    const first = mountTimeline()
    await first.wrapper.get('[data-add]').trigger('click')
    expect(window.localStorage.getItem(cle('studio'))).toContain('Idle')
    first.wrapper.unmount()
    session?.dispose()

    const { wrapper } = mountTimeline()
    expect(wrapper.findAll('[data-carte]')).toHaveLength(2)
  })

  it('seeds a new cycle from the desk pose', async () => {
    const { wrapper, desk } = mountTimeline()
    desk.commit({ field: 'pose', value: 'Comet' })
    await nextTick()
    await wrapper.get('[data-cycle-new]').trigger('click')
    await wrapper.get('[data-cycle-form]').trigger('submit')
    await nextTick()
    expect(wrapper.findAll('[data-carte]')).toHaveLength(1)
    expect(wrapper.get('[data-block="0"]').attributes('data-state')).toBe('Comet')
  })

  it('translates transport copy', async () => {
    const { wrapper } = mountTimeline()
    langue.value = 'fr'
    await nextTick()
    expect(wrapper.get('[data-play]').attributes('aria-label')).toBe(fr.timeline.play)
    expect(wrapper.get('[data-cycle-new]').text()).toBe(fr.cycles.menuNew)
    expect(t('cycles.defaultName')).toBe(fr.cycles.defaultName)
  })
})
