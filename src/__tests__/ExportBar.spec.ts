import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import ExportBar from '../components/ExportBar.vue'
import { langue } from '../i18n'
import en from '../i18n/locales/en'
import fr from '../i18n/locales/fr'

describe('ExportBar', () => {
  afterEach(() => {
    langue.value = 'en'
  })

  it('offers SVG and PNG of the current frame, GIF and MP4 of the montage', () => {
    const wrapper = mount(ExportBar, { props: { etat: 'pret' } })
    expect(wrapper.get('[data-export-bar]').text()).toContain(en.export.title)
    expect(wrapper.get('[data-export="png"]').text()).toBe(en.export.png)
    expect(wrapper.get('[data-export="svg"]').text()).toBe(en.export.svg)
    expect(wrapper.get('[data-export="gif"]').text()).toBe(en.export.gif)
    expect(wrapper.get('[data-export="mp4"]').text()).toBe(en.export.mp4)
  })

  it('emits the chosen still or montage format', async () => {
    const wrapper = mount(ExportBar, { props: { etat: 'pret' } })
    await wrapper.get('[data-export="svg"]').trigger('click')
    await wrapper.get('[data-export="png"]').trigger('click')
    await wrapper.get('[data-export="gif"]').trigger('click')
    await wrapper.get('[data-export="mp4"]').trigger('click')
    expect(wrapper.emitted('exporter')).toEqual([['svg'], ['png'], ['gif'], ['mp4']])
  })

  it('disables the buttons while an export is running', () => {
    const wrapper = mount(ExportBar, { props: { etat: 'occupe' } })
    expect(wrapper.get('[data-export="png"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-export="svg"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-export="gif"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-export="mp4"]').attributes('disabled')).toBeDefined()
  })

  it('confirms a finished export', () => {
    const wrapper = mount(ExportBar, { props: { etat: 'exporte' } })
    expect(wrapper.get('[data-export-status]').text()).toBe(en.export.done)
  })

  it('translates the export labels', async () => {
    langue.value = 'fr'
    const wrapper = mount(ExportBar, { props: { etat: 'pret' } })
    expect(wrapper.get('[data-export="png"]').text()).toBe(fr.export.png)
    expect(wrapper.get('[data-export="gif"]').text()).toBe(fr.export.gif)
    langue.value = 'en'
  })
})
