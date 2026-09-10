import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import ExportBar from '../components/ExportBar.vue'
import { langue } from '../i18n'
import en from '../i18n/locales/en'
import fr from '../i18n/locales/fr'

const still = {
  kind: 'image' as const,
  formats: [
    { format: 'png' as const, enabled: true },
    { format: 'svg' as const, enabled: true },
  ],
  state: 'ready' as const,
  pose: 'Idle' as const,
  poseDuration: 2,
}

const motion = {
  kind: 'video' as const,
  formats: [
    { format: 'mp4' as const, enabled: true },
    { format: 'gif' as const, enabled: true },
  ],
  state: 'ready' as const,
  pose: 'Idle' as const,
  poseDuration: 2,
  cycleName: en.cycles.defaultName,
  cycleDuration: 2,
  cycleBlockCount: 1,
}

describe('ExportBar', () => {
  afterEach(() => {
    langue.value = 'en'
  })

  it('leads with the first offered format for the desk', () => {
    const image = mount(ExportBar, { props: still })
    expect(image.get('[data-export-primary]').attributes('data-export')).toBe('png')
    expect(image.get('[data-export-primary]').text()).toContain('Idle')
    expect(image.get('[data-export-meta]').text()).toContain('2 s')
    expect(image.get('[data-export="svg"]').text()).toBe(en.export.svg)

    const video = mount(ExportBar, { props: motion })
    expect(video.get('[data-export-primary]').attributes('data-export')).toBe('mp4')
    expect(video.get('[data-export-primary]').text()).toContain('MP4')
    expect(video.get('[data-export-meta]').text()).toContain(en.cycles.defaultName)
  })

  it('offers no still format on the video desk and no motion format on the image desk', () => {
    const image = mount(ExportBar, { props: still })
    expect(image.find('[data-export="gif"]').exists()).toBe(false)
    expect(image.find('[data-export="mp4"]').exists()).toBe(false)

    const video = mount(ExportBar, { props: motion })
    expect(video.find('[data-export="png"]').exists()).toBe(false)
    expect(video.find('[data-export="svg"]').exists()).toBe(false)
  })

  it('emits the format the reader clicked', async () => {
    const wrapper = mount(ExportBar, { props: motion })
    await wrapper.get('[data-export-primary]').trigger('click')
    await wrapper.get('[data-export="gif"]').trigger('click')
    expect(wrapper.emitted('deliver')).toEqual([['mp4'], ['gif']])
  })

  it('shows an unavailable format as disabled with a reason rather than hiding it', () => {
    const wrapper = mount(ExportBar, {
      props: {
        ...motion,
        formats: [
          { format: 'mp4' as const, enabled: false },
          { format: 'gif' as const, enabled: true },
        ],
      },
    })
    const mp4 = wrapper.get('[data-export="mp4"]')
    expect(mp4.attributes('disabled')).toBeDefined()
    expect(mp4.attributes('title')).toBe(en.export.mp4Unavailable)
    // Primary falls through to the format that can actually run.
    expect(wrapper.get('[data-export-primary]').attributes('data-export')).toBe('gif')
  })

  it('groups banner formats apart from the plain download', () => {
    const wrapper = mount(ExportBar, {
      props: {
        ...still,
        formats: [...still.formats, { format: 'banner-png' as const, enabled: true }],
      },
    })
    expect(wrapper.get('[data-export-group="banner"] [data-export="banner-png"]').text()).toBe(
      en.export.bannerPng,
    )
    expect(wrapper.get('[data-export-primary]').attributes('data-export')).toBe('png')
  })

  it('disables the buttons while an export is running and shows busy status', () => {
    const wrapper = mount(ExportBar, { props: { ...motion, state: 'busy', progress: 40 } })
    expect(wrapper.get('[data-export-primary]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-export-status]').text()).toContain('40')
    expect(wrapper.get('[data-export-status]').attributes('data-export-busy')).toBe('')
    expect(wrapper.get('[data-export-cancel]').text()).toBe(en.export.cancel)
  })

  it('counts no percentage for a still, which has no frames to count', () => {
    const wrapper = mount(ExportBar, { props: { ...still, state: 'busy' } })
    const status = wrapper.get('[data-export-status]')
    expect(status.text()).toBe(en.export.busy)
    expect(status.attributes('data-export-progress')).toBeUndefined()
    expect(wrapper.get('[data-export-cancel]').exists()).toBe(true)
  })

  it('confirms a finished export', () => {
    const wrapper = mount(ExportBar, { props: { ...motion, state: 'done' } })
    expect(wrapper.get('[data-export-status]').text()).toBe(en.export.done)
  })

  it('translates the export labels', () => {
    langue.value = 'fr'
    const wrapper = mount(ExportBar, {
      props: { ...motion, cycleName: fr.cycles.defaultName },
    })
    expect(wrapper.get('[data-export-primary]').text()).toContain('MP4')
    expect(wrapper.get('[data-export="gif"]').text()).toBe(fr.export.gif)
  })
})
