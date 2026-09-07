import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App.vue'
import { brand } from '../brand'
import { rechargerApparence } from '../customise'
import { ANIMATION_STATES, COLORS, EXPRESSIONS, SHAPES, type Cycle } from '../engine'
import { cle, langue, rechargerLangue } from '../i18n'
import en from '../i18n/locales/en'
import fr from '../i18n/locales/fr'
import zh from '../i18n/locales/zh'
import { ecris } from '../i18n/stockage'

const { exporte, exporteMontage } = vi.hoisted(() => ({
  exporte: vi.fn<(svg: SVGSVGElement, id: string, etat: string) => Promise<void>>(),
  exporteMontage: vi.fn<
    (
      format: 'gif' | 'mp4',
      cycle: Cycle,
      reglages: { shape: string; colour: string; expression: string },
      nom: string,
    ) => Promise<void>
  >(),
}))

vi.mock('../ui/capture', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../ui/capture')>()
  return { ...actual, exporte, exporteMontage }
})

describe('App', () => {
  beforeEach(() => {
    history.replaceState(null, '', '/')
    window.localStorage.clear()
    rechargerLangue()
    rechargerApparence()
    langue.value = 'en'
    exporte.mockClear()
    exporteMontage.mockClear()
  })

  afterEach(() => {
    history.replaceState(null, '', '/')
  })

  it('renders the Grok_bot avatar with default props', () => {
    const wrapper = mount(App)
    expect(wrapper.text()).toContain(brand.name)
    expect(wrapper.text()).toContain(en.app.tagline)
    const svg = wrapper.get('#studio svg[role="img"]')
    expect(svg.attributes('data-state')).toBe('Idle')
    expect(svg.attributes('data-shape')).toBe('circle')
    expect(svg.attributes('data-expression')).toBe('neutral')
    expect(svg.attributes('data-colour')).toBe('ink')
    expect(wrapper.findAll('#studio svg[role="img"]')).toHaveLength(1)
    expect(svg.findAll('[data-eye]')).toHaveLength(2)
    const path = svg.get('path')
    expect(path.attributes('d')?.startsWith('M')).toBe(true)
  })

  it('grows the studio avatar from the stage box', async () => {
    const seen: ResizeObserverCallback[] = []
    class FakeObserver implements ResizeObserver {
      constructor(cb: ResizeObserverCallback) {
        seen.push(cb)
      }
      disconnect() {}
      observe() {}
      unobserve() {}
      takeRecords(): ResizeObserverEntry[] {
        return []
      }
    }
    vi.stubGlobal('ResizeObserver', FakeObserver)
    const wrapper = mount(App)
    expect(wrapper.get('#studio svg[role="img"]').attributes('width')).toBe('220')

    const entry = { contentRect: { width: 800, height: 600 } } as ResizeObserverEntry
    seen[0]!([entry], {} as ResizeObserver)
    await wrapper.vm.$nextTick()

    expect(wrapper.get('#studio svg[role="img"]').attributes('width')).toBe('432')
    expect(wrapper.get('#studio svg[role="img"]').attributes('height')).toBe('432')
    expect(wrapper.findAll('#studio svg[role="img"]')).toHaveLength(1)
    wrapper.unmount()
    vi.unstubAllGlobals()
  })

  it('wires the customise panel to the avatar and persists the choice', async () => {
    const wrapper = mount(App)
    await wrapper.get('[data-mode="shape"]').trigger('click')
    const panel = wrapper.get('[data-customise-panel]')
    expect(panel.findAll('[data-shape]')).toHaveLength(SHAPES.length)

    await panel.get('[data-shape="hexagon"]').trigger('click')
    await wrapper.get('[data-mode="expression"]').trigger('click')
    expect(wrapper.get('[data-customise-panel]').findAll('[data-expression]')).toHaveLength(
      EXPRESSIONS.length,
    )
    await wrapper.get('[data-expression="happy"]').trigger('click')
    await wrapper.get('[data-mode="colour"]').trigger('click')
    expect(wrapper.get('[data-customise-panel]').findAll('[data-colour]')).toHaveLength(COLORS.length)
    await wrapper.get('[data-colour="blue"]').trigger('click')

    const svg = wrapper.get('#studio svg[role="img"]')
    expect(svg.attributes('data-shape')).toBe('hexagon')
    expect(svg.attributes('data-expression')).toBe('happy')
    expect(svg.attributes('data-colour')).toBe('blue')
    expect(window.localStorage.getItem(cle('forme'))).toBe('hexagon')
    expect(window.localStorage.getItem(cle('expression'))).toBe('happy')
    expect(window.localStorage.getItem(cle('couleur'))).toBe('blue')
  })

  it('restores stored shape, expression, and colour on load', async () => {
    ecris('forme', 'droplet')
    ecris('expression', 'sleepy')
    ecris('couleur', 'cream')
    rechargerApparence()
    const wrapper = mount(App)
    const svg = wrapper.get('#studio svg[role="img"]')
    expect(svg.attributes('data-shape')).toBe('droplet')
    expect(svg.attributes('data-expression')).toBe('sleepy')
    expect(svg.attributes('data-colour')).toBe('cream')
    await wrapper.get('[data-mode="shape"]').trigger('click')
    expect(wrapper.get('[data-customise-panel] [data-shape="droplet"]').attributes('aria-checked')).toBe(
      'true',
    )
    await wrapper.get('[data-mode="expression"]').trigger('click')
    expect(
      wrapper.get('[data-customise-panel] [data-expression="sleepy"]').attributes('aria-checked'),
    ).toBe('true')
    await wrapper.get('[data-mode="colour"]').trigger('click')
    expect(wrapper.get('[data-customise-panel] [data-colour="cream"]').attributes('aria-checked')).toBe(
      'true',
    )
  })

  it('morphs Idle to Thinking from the animations palette', async () => {
    const wrapper = mount(App)
    await wrapper.get('[data-mode="state"]').trigger('click')
    const palette = wrapper.get('[data-animations-palette]')
    expect(palette.findAll('[data-state]')).toHaveLength(ANIMATION_STATES.length)
    expect(palette.get('[data-state="Idle"]').attributes('aria-checked')).toBe('true')

    await wrapper.get('[data-animations-palette] [data-state="Thinking"]').trigger('click')

    expect(wrapper.get('#studio svg[role="img"]').attributes('data-target')).toBe('Thinking')
    expect(wrapper.get('[data-animations-palette] [data-state="Thinking"]').attributes('aria-checked')).toBe(
      'true',
    )
    expect(location.hash).toBe('#etat=thinking&stop')
  })

  it('drives the avatar morph to Comet from the palette', async () => {
    const wrapper = mount(App)
    await wrapper.get('[data-mode="state"]').trigger('click')
    await wrapper.get('[data-animations-palette] [data-state="Comet"]').trigger('click')
    expect(wrapper.get('#studio svg[role="img"]').attributes('data-target')).toBe('Comet')
    expect(wrapper.get('[data-animations-palette] [data-state="Comet"]').attributes('aria-checked')).toBe(
      'true',
    )
  })

  it('renders English nav and settings strings by default', () => {
    const wrapper = mount(App)
    expect(wrapper.get('[data-nav="studio"]').text()).toBe(en.nav.studio)
    expect(wrapper.get('[data-nav="customise"]').text()).toBe(en.nav.customise)
    expect(wrapper.get('[data-nav="settings"]').text()).toBe(en.nav.settings)
    expect(wrapper.get('[data-nav="about"]').text()).toBe(en.nav.about)
    expect(wrapper.text()).toContain(en.panel.shape)
    expect(wrapper.text()).toContain(en.animations.title)
    expect(wrapper.text()).toContain(en.settings.title)
    expect(wrapper.text()).toContain(en.settings.language)
    expect(wrapper.get('[data-locale="en"]').text()).toContain('English')
    expect(wrapper.get('[data-locale="fr"]').text()).toContain('Français')
    expect(wrapper.get('[data-locale="zh"]').text()).toContain('简体中文')
  })

  it('switches nav and settings copy to French and persists the locale', async () => {
    const wrapper = mount(App)
    await wrapper.get('[data-locale="fr"]').trigger('click')

    expect(wrapper.get('[data-nav="customise"]').text()).toBe(fr.nav.customise)
    expect(wrapper.get('[data-nav="settings"]').text()).toBe(fr.nav.settings)
    expect(wrapper.get('[data-nav="about"]').text()).toBe(fr.nav.about)
    expect(wrapper.text()).toContain(fr.panel.shape)
    expect(wrapper.text()).toContain(fr.animations.title)
    expect(wrapper.text()).toContain(fr.settings.language)
    expect(window.localStorage.getItem(cle('langue'))).toBe('fr')
    expect(document.documentElement.lang).toBe('fr')
  })

  it('switches copy to Simplified Chinese', async () => {
    const wrapper = mount(App)
    await wrapper.get('[data-locale="zh"]').trigger('click')

    expect(wrapper.get('[data-nav="customise"]').text()).toBe(zh.nav.customise)
    expect(wrapper.get('[data-nav="settings"]').text()).toBe(zh.nav.settings)
    expect(wrapper.get('[data-nav="about"]').text()).toBe(zh.nav.about)
    expect(wrapper.text()).toContain(zh.panel.shape)
    expect(wrapper.text()).toContain(zh.animations.title)
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

  it('plays a timeline block onto the avatar and still lets the palette preview', async () => {
    const wrapper = mount(App)
    expect(wrapper.find('[data-timeline]').exists()).toBe(true)
    expect(wrapper.get('[data-timeline] [data-block="0"]').attributes('data-state')).toBe('Idle')

    await wrapper.get('[data-timeline] [data-block="1"] [data-carte]').trigger('click')
    expect(wrapper.get('#studio svg[role="img"]').attributes('data-target')).toBe('Thinking')

    await wrapper.get('[data-play]').trigger('click')
    expect(wrapper.get('[data-play]').attributes('aria-pressed')).toBe('true')
    expect(location.hash).toBe('#etat=thinking')

    await wrapper.get('[data-mode="state"]').trigger('click')
    await wrapper.get('[data-animations-palette] [data-state="Comet"]').trigger('click')
    expect(wrapper.get('[data-play]').attributes('aria-pressed')).toBe('false')
    expect(wrapper.get('#studio svg[role="img"]').attributes('data-target')).toBe('Comet')
    expect(wrapper.get('[data-animations-palette] [data-state="Comet"]').attributes('aria-checked')).toBe(
      'true',
    )
    expect(location.hash).toBe('#etat=comet&stop')
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

  it('exports the current avatar frame as SVG', async () => {
    const wrapper = mount(App)
    await wrapper.get('[data-export="svg"]').trigger('click')
    await flushPromises()
    expect(exporte).toHaveBeenCalledOnce()
    expect(exporte).toHaveBeenCalledWith(expect.any(SVGSVGElement), 'svg', 'Idle')
    expect(wrapper.get('[data-export-status]').text()).toBe(en.export.done)
    wrapper.unmount()
  })

  it('exports the current avatar frame as PNG', async () => {
    const wrapper = mount(App)
    await wrapper.get('[data-export="png"]').trigger('click')
    await flushPromises()
    expect(exporte).toHaveBeenCalledOnce()
    expect(exporte).toHaveBeenCalledWith(expect.any(SVGSVGElement), 'png', 'Idle')
    expect(wrapper.get('[data-export-status]').text()).toBe(en.export.done)
    wrapper.unmount()
  })

  it('names the download after the selected animation state', async () => {
    const wrapper = mount(App)
    await wrapper.get('[data-mode="state"]').trigger('click')
    await wrapper.get('[data-animations-palette] [data-state="Comet"]').trigger('click')
    await wrapper.get('[data-export="svg"]').trigger('click')
    await flushPromises()
    expect(exporte).toHaveBeenCalledWith(expect.any(SVGSVGElement), 'svg', 'Comet')
    wrapper.unmount()
  })

  it('exports the montage as GIF', async () => {
    const wrapper = mount(App)
    await wrapper.get('[data-export="gif"]').trigger('click')
    await flushPromises()
    expect(exporteMontage).toHaveBeenCalledOnce()
    expect(exporte).not.toHaveBeenCalled()
    const [format, cycle, reglages, nom] = exporteMontage.mock.calls[0]!
    expect(format).toBe('gif')
    expect(cycle.blocks.length).toBe(ANIMATION_STATES.length)
    expect(reglages).toMatchObject({ shape: 'circle', colour: 'ink', expression: 'neutral' })
    expect(nom).toBe(en.cycles.defaultName)
    expect(wrapper.get('[data-export-status]').text()).toBe(en.export.done)
    wrapper.unmount()
  })

  it('exports the montage as MP4', async () => {
    const wrapper = mount(App)
    await wrapper.get('[data-export="mp4"]').trigger('click')
    await flushPromises()
    expect(exporteMontage).toHaveBeenCalledOnce()
    expect(exporte).not.toHaveBeenCalled()
    expect(exporteMontage.mock.calls[0]?.[0]).toBe('mp4')
    expect(wrapper.get('[data-export-status]').text()).toBe(en.export.done)
    wrapper.unmount()
  })

  it('writes #etat=idle&stop on load so the pose is shareable', () => {
    const wrapper = mount(App)
    expect(location.hash).toBe('#etat=idle&stop')
    wrapper.unmount()
  })

  it('opens a named pose from the hash on load', () => {
    history.replaceState(null, '', '#etat=thinking&stop')
    const wrapper = mount(App)
    expect(wrapper.get('#studio svg[role="img"]').attributes('data-target')).toBe('Thinking')
    expect(wrapper.get('[data-animations-palette] [data-state="Thinking"]').attributes('aria-checked')).toBe(
      'true',
    )
    expect(location.hash).toBe('#etat=thinking&stop')
    wrapper.unmount()
  })

  it('ignores unknown #etat= values and falls back to Idle', () => {
    history.replaceState(null, '', '#etat=swirl')
    const wrapper = mount(App)
    expect(wrapper.get('#studio svg[role="img"]').attributes('data-state')).toBe('Idle')
    expect(location.hash).toBe('#etat=idle&stop')
    wrapper.unmount()
  })

  it('applies a later #etat= change without clobbering it from the nav', async () => {
    const wrapper = mount(App)

    history.replaceState(null, '', '#etat=orbit&stop')
    window.dispatchEvent(new HashChangeEvent('hashchange'))
    await flushPromises()

    expect(wrapper.get('#studio svg[role="img"]').attributes('data-target')).toBe('Orbit')
    expect(location.hash).toBe('#etat=orbit&stop')

    await wrapper.get('[data-nav="customise"]').trigger('click')
    expect(location.hash).toBe('#etat=orbit&stop')
    wrapper.unmount()
  })
})
