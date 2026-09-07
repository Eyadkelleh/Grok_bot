import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '../App.vue'
import { brand } from '../brand'
import { cle, langue, rechargerLangue } from '../i18n'
import en from '../i18n/locales/en'
import fr from '../i18n/locales/fr'
import zh from '../i18n/locales/zh'
import { ecris } from '../i18n/stockage'

describe('App', () => {
  beforeEach(() => {
    window.localStorage.clear()
    rechargerLangue()
    langue.value = 'en'
  })

  it('renders the Grok_bot placeholder and a morphing avatar', () => {
    const wrapper = mount(App)
    expect(wrapper.text()).toContain(brand.name)
    expect(wrapper.text()).toContain(en.app.tagline)
    const svg = wrapper.get('svg[role="img"]')
    expect(svg.attributes('data-state')).toBe('Idle')
    const path = svg.get('path')
    expect(path.attributes('d')?.startsWith('M')).toBe(true)
  })

  it('morphs Idle to Thinking from the demo control', async () => {
    const wrapper = mount(App)
    const button = wrapper.get('[data-morph-toggle]')
    expect(button.text()).toMatch(/thinking/i)
    await button.trigger('click')
    expect(wrapper.get('svg[role="img"]').attributes('data-target')).toBe('Thinking')
    expect(button.text()).toMatch(/idle/i)
  })

  it('renders English nav and settings strings by default', () => {
    const wrapper = mount(App)
    expect(wrapper.get('[data-nav="studio"]').text()).toBe(en.nav.studio)
    expect(wrapper.get('[data-nav="settings"]').text()).toBe(en.nav.settings)
    expect(wrapper.get('[data-nav="about"]').text()).toBe(en.nav.about)
    expect(wrapper.text()).toContain(en.settings.title)
    expect(wrapper.text()).toContain(en.settings.language)
    expect(wrapper.get('[data-locale="en"]').text()).toContain('English')
    expect(wrapper.get('[data-locale="fr"]').text()).toContain('Français')
    expect(wrapper.get('[data-locale="zh"]').text()).toContain('简体中文')
  })

  it('switches nav and settings copy to French and persists the locale', async () => {
    const wrapper = mount(App)
    await wrapper.get('[data-locale="fr"]').trigger('click')

    expect(wrapper.get('[data-nav="settings"]').text()).toBe(fr.nav.settings)
    expect(wrapper.get('[data-nav="about"]').text()).toBe(fr.nav.about)
    expect(wrapper.text()).toContain(fr.settings.language)
    expect(window.localStorage.getItem(cle('langue'))).toBe('fr')
    expect(document.documentElement.lang).toBe('fr')
  })

  it('switches copy to Simplified Chinese', async () => {
    const wrapper = mount(App)
    await wrapper.get('[data-locale="zh"]').trigger('click')

    expect(wrapper.get('[data-nav="settings"]').text()).toBe(zh.nav.settings)
    expect(wrapper.get('[data-nav="about"]').text()).toBe(zh.nav.about)
    expect(wrapper.text()).toContain(zh.settings.language)
    expect(window.localStorage.getItem(cle('langue'))).toBe('zh')
    expect(document.documentElement.lang).toBe('zh-Hans')
  })

  it('restores the stored locale on load', () => {
    ecris('langue', 'fr')
    rechargerLangue()
    const wrapper = mount(App)
    expect(wrapper.get('[data-nav="settings"]').text()).toBe(fr.nav.settings)
    expect(document.documentElement.lang).toBe('fr')
  })

  it('shows about/credits for Grok_bot, bloub MIT, and no xAI affiliation', () => {
    const wrapper = mount(App)
    expect(wrapper.text()).toContain('Grok_bot')
    expect(wrapper.get('[data-credits]').text()).toMatch(/bloub/i)
    expect(wrapper.get('[data-credits]').text()).toMatch(/MIT/)
    expect(wrapper.get('[data-disclaimer]').text()).toMatch(/xAI/)
    expect(wrapper.get('[data-disclaimer]').text().toLowerCase()).toMatch(
      /not affiliated|sans affiliation|没有任何/,
    )
  })
})
