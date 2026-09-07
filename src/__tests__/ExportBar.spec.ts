import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ExportBar from '../components/ExportBar.vue'
import { langue } from '../i18n'
import en from '../i18n/locales/en'
import fr from '../i18n/locales/fr'

vi.mock('../ui/export', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../ui/export')>()
  return { ...actual, videoPossible: () => true }
})

const baseProps = {
  etat: 'pret' as const,
  pose: 'Idle' as const,
  cycleName: en.cycles.defaultName,
  cycleDuration: 2,
  cycleBlockCount: 1,
}

describe('ExportBar', () => {
  afterEach(() => {
    langue.value = 'en'
  })

  it('groups stills and video, defaulting video to the current pose', () => {
    const wrapper = mount(ExportBar, { props: baseProps })
    expect(wrapper.get('[data-export-bar]').text()).toContain(en.export.title)
    expect(wrapper.find('[data-export-group="still"]').exists()).toBe(true)
    expect(wrapper.find('[data-export-group="montage"]').exists()).toBe(true)
    expect(wrapper.get('[data-export-pose]').attributes('aria-checked')).toBe('true')
    expect(wrapper.get('[data-export="png"]').text()).toBe(en.export.png)
    expect(wrapper.get('[data-export="gif"]').text()).toContain('Idle')
    expect(wrapper.get('[data-export-meta]').text()).toContain('2 s')
  })

  it('emits the chosen still or video format with the video source', async () => {
    const wrapper = mount(ExportBar, { props: baseProps })
    await wrapper.get('[data-export="svg"]').trigger('click')
    await wrapper.get('[data-export="png"]').trigger('click')
    await wrapper.get('[data-export="gif"]').trigger('click')
    await wrapper.get('[data-export-cycle]').trigger('click')
    await wrapper.get('[data-export="mp4"]').trigger('click')
    expect(wrapper.emitted('exporter')).toEqual([
      [{ action: 'svg', videoSource: 'pose' }],
      [{ action: 'png', videoSource: 'pose' }],
      [{ action: 'gif', videoSource: 'pose' }],
      [{ action: 'mp4', videoSource: 'cycle' }],
    ])
  })

  it('shows progress and lets the user cancel a running export', async () => {
    const wrapper = mount(ExportBar, {
      props: { ...baseProps, etat: 'occupe', progress: 35 },
    })
    expect(wrapper.get('[data-export="png"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-export-status]').text()).toContain('35%')
    expect(wrapper.get('[data-export-progress]').attributes('data-export-progress')).toBe('35')
    expect(wrapper.find('[data-export-busy]').exists()).toBe(true)
    await wrapper.get('[data-export-cancel]').trigger('click')
    expect(wrapper.emitted('annuler')).toHaveLength(1)
  })

  it('confirms a finished export', () => {
    const wrapper = mount(ExportBar, { props: { ...baseProps, etat: 'exporte' } })
    expect(wrapper.get('[data-export-status]').text()).toBe(en.export.done)
  })

  it('translates the export labels', async () => {
    langue.value = 'fr'
    const wrapper = mount(ExportBar, { props: { ...baseProps, cycleName: fr.cycles.defaultName } })
    expect(wrapper.get('[data-export="png"]').text()).toBe(fr.export.png)
    expect(wrapper.get('[data-export-group="montage"]').text()).toContain(fr.export.video)
    langue.value = 'en'
  })
})
