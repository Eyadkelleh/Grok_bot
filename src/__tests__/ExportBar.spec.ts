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

  it('leads with a primary pose video download', () => {
    const wrapper = mount(ExportBar, { props: baseProps })
    expect(wrapper.get('[data-export-primary]').text()).toContain('MP4')
    expect(wrapper.get('[data-export-primary]').text()).toContain('Idle')
    expect(wrapper.get('[data-export-meta]').text()).toContain('2 s')
    expect(wrapper.get('[data-export="gif"]').text()).toContain('GIF')
  })

  it('keeps the primary CTA on this pose even after picking the cycle', async () => {
    const wrapper = mount(ExportBar, { props: baseProps })
    expect(wrapper.get('[data-export-more] summary').text()).toBe(en.export.moreOptions)
    expect(wrapper.get('[data-export-group="still"] [data-export="png"]').text()).toBe(en.export.png)
    expect(wrapper.get('[data-export-pose]').attributes('aria-checked')).toBe('true')
    await wrapper.get('[data-export-cycle]').trigger('click')
    await wrapper.get('[data-export-primary]').trigger('click')
    const emitted = wrapper.emitted('exporter')
    expect(emitted?.[emitted.length - 1]).toEqual([{ action: 'mp4', videoSource: 'pose' }])
  })

  it('exports the timeline cycle from advanced controls', async () => {
    const wrapper = mount(ExportBar, { props: baseProps })
    await wrapper.get('[data-export-cycle]').trigger('click')
    await wrapper.get('[data-export-more] [data-export="gif"]').trigger('click')
    expect(wrapper.emitted('exporter')).toEqual([[{ action: 'gif', videoSource: 'cycle' }]])
  })

  it('emits gif from the secondary control', async () => {
    const wrapper = mount(ExportBar, { props: baseProps })
    await wrapper.get('[data-export="gif"]').trigger('click')
    expect(wrapper.emitted('exporter')).toEqual([[{ action: 'gif', videoSource: 'pose' }]])
  })

  it('disables the buttons while an export is running and shows busy status', () => {
    const wrapper = mount(ExportBar, { props: { ...baseProps, etat: 'occupe', progress: 40 } })
    expect(wrapper.get('[data-export-primary]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-export-status]').text()).toContain('40')
    expect(wrapper.get('[data-export-busy]').attributes('data-export-busy')).toBe('')
    expect(wrapper.get('[data-export-cancel]').text()).toBe(en.export.cancel)
  })

  it('confirms a finished export', () => {
    const wrapper = mount(ExportBar, { props: { ...baseProps, etat: 'exporte' } })
    expect(wrapper.get('[data-export-status]').text()).toBe(en.export.done)
  })

  it('translates the export labels', async () => {
    langue.value = 'fr'
    const wrapper = mount(ExportBar, { props: { ...baseProps, cycleName: fr.cycles.defaultName } })
    expect(wrapper.get('[data-export-primary]').text()).toContain('MP4')
    expect(wrapper.get('[data-export-more] summary').text()).toBe(fr.export.moreOptions)
    langue.value = 'en'
  })
})
