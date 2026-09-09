import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App.vue'
import { brand } from '../brand'
import { ANIMATION_STATES, COLORS, EXPRESSIONS, SHAPES, type Cycle } from '../engine'
import { cle, langue, rechargerLangue } from '../i18n'
import en from '../i18n/locales/en'
import fr from '../i18n/locales/fr'
import zh from '../i18n/locales/zh'
import { ecris } from '../i18n/stockage'
import { parseStudioDoc, saveDoc, defaultStudioDoc } from '../studio'
import { Abandon } from '../ui/export'
import Timeline from '../components/Timeline.vue'

const { exporte, exporteMontage } = vi.hoisted(() => ({
  exporte: vi.fn<(svg: SVGSVGElement, id: string, etat: string) => Promise<void>>(),
  exporteMontage: vi.fn<
    (
      format: 'gif' | 'mp4',
      cycle: Cycle,
      reglages: { shape: string; colour: string; expression: string },
      nom: string,
      avance?: (fait: number, total: number) => void,
      signal?: AbortSignal,
    ) => Promise<void>
  >(),
}))

vi.mock('../ui/capture', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../ui/capture')>()
  return { ...actual, exporte, exporteMontage }
})

function stored() {
  return parseStudioDoc(window.localStorage.getItem(cle('studio')))
}

async function toVideo(wrapper: VueWrapper) {
  await wrapper.get('[data-output-dock] [data-desk="video"]').trigger('click')
  await flushPromises()
}

describe('App', () => {
  beforeEach(() => {
    history.replaceState(null, '', '/')
    window.localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    rechargerLangue()
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

  it('previews a shape on pointer hover without writing storage', async () => {
    const wrapper = mount(App)
    await wrapper.get('[data-mode="shape"]').trigger('click')
    const tile = wrapper.get('[data-customise-panel] [data-shape="hexagon"]')
    await tile.trigger('pointerover')
    expect(wrapper.get('#studio svg[role="img"]').attributes('data-shape')).toBe('hexagon')
    expect(stored()?.image.look.shape).not.toBe('hexagon')

    await tile.trigger('click')
    expect(stored()?.image.look.shape).toBe('hexagon')
  })

  it('previews a face on pointer hover without writing storage', async () => {
    const wrapper = mount(App)
    await wrapper.get('[data-mode="expression"]').trigger('click')
    const tile = wrapper.get('[data-customise-panel] [data-expression="happy"]')
    await tile.trigger('pointerover')
    expect(wrapper.get('#studio svg[role="img"]').attributes('data-expression')).toBe('happy')
    expect(stored()?.image.look.expression).not.toBe('happy')

    await tile.trigger('click')
    expect(stored()?.image.look.expression).toBe('happy')
  })

  it('previews a motion pose on pointer hover without committing', async () => {
    const wrapper = mount(App)
    await wrapper.get('[data-mode="state"]').trigger('click')
    const tile = wrapper.get('[data-animations-palette] [data-state="Comet"]')
    await tile.trigger('pointerover')
    expect(wrapper.get('#studio svg[role="img"]').attributes('data-target')).toBe('Comet')
    expect(
      wrapper.get('[data-animations-palette] [data-state="Idle"]').attributes('aria-checked'),
    ).toBe('true')
    expect(location.hash).toBe('#etat=idle&stop')

    await tile.trigger('click')
    expect(
      wrapper.get('[data-animations-palette] [data-state="Comet"]').attributes('aria-checked'),
    ).toBe('true')
    expect(location.hash).toBe('#etat=comet&stop')
  })

  it('draws a cavity outline on symbol poses without a second image role', async () => {
    const wrapper = mount(App)
    await wrapper.get('[data-mode="state"]').trigger('click')
    await wrapper.get('[data-animations-palette] [data-state="Play"]').trigger('click')
    const figure = wrapper.get('#studio svg[role="img"]')
    expect(figure.attributes('data-shape-applied')).toBe('false')
    expect(figure.attributes('data-geometry-kind')).toBe('symbol')
    expect(wrapper.get('[data-cavity-shape]').attributes('data-cavity-shape')).toBe('circle')
    expect(wrapper.get('[data-cavity-shape]').attributes('data-shape-applied')).toBe('false')
    expect(wrapper.get('[data-cavity-shape]').attributes('aria-hidden')).toBe('true')
    expect(wrapper.findAll('#studio svg[role="img"]')).toHaveLength(1)
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
    expect(wrapper.get('[data-customise-panel]').findAll('[data-colour]')).toHaveLength(
      COLORS.length,
    )
    await wrapper.get('[data-colour="blue"]').trigger('click')

    const svg = wrapper.get('#studio svg[role="img"]')
    expect(svg.attributes('data-shape')).toBe('hexagon')
    expect(svg.attributes('data-expression')).toBe('happy')
    expect(svg.attributes('data-colour')).toBe('blue')
    expect(stored()?.image.look).toMatchObject({
      shape: 'hexagon',
      expression: 'happy',
      colour: 'blue',
    })
  })

  it('restores stored shape, expression, and colour on load', async () => {
    const doc = defaultStudioDoc()
    saveDoc({
      ...doc,
      image: {
        ...doc.image,
        look: { ...doc.image.look, shape: 'droplet', expression: 'sleepy', colour: 'cream' },
      },
    })
    const wrapper = mount(App)
    const svg = wrapper.get('#studio svg[role="img"]')
    expect(svg.attributes('data-shape')).toBe('droplet')
    expect(svg.attributes('data-expression')).toBe('sleepy')
    expect(svg.attributes('data-colour')).toBe('cream')
    await wrapper.get('[data-mode="shape"]').trigger('click')
    expect(
      wrapper.get('[data-customise-panel] [data-shape="droplet"]').attributes('aria-checked'),
    ).toBe('true')
    await wrapper.get('[data-mode="expression"]').trigger('click')
    expect(
      wrapper.get('[data-customise-panel] [data-expression="sleepy"]').attributes('aria-checked'),
    ).toBe('true')
    await wrapper.get('[data-mode="colour"]').trigger('click')
    expect(
      wrapper.get('[data-customise-panel] [data-colour="cream"]').attributes('aria-checked'),
    ).toBe('true')
  })

  it('morphs Idle to Thinking from the animations palette', async () => {
    const wrapper = mount(App)
    await wrapper.get('[data-mode="state"]').trigger('click')
    const palette = wrapper.get('[data-animations-palette]')
    expect(palette.findAll('[data-state]')).toHaveLength(ANIMATION_STATES.length)
    expect(palette.get('[data-state="Idle"]').attributes('aria-checked')).toBe('true')

    await wrapper.get('[data-animations-palette] [data-state="Thinking"]').trigger('click')

    expect(wrapper.get('#studio svg[role="img"]').attributes('data-target')).toBe('Thinking')
    expect(
      wrapper.get('[data-animations-palette] [data-state="Thinking"]').attributes('aria-checked'),
    ).toBe('true')
    expect(location.hash).toBe('#etat=thinking&stop')
  })

  it('renders English nav, dock, and settings strings by default', () => {
    const wrapper = mount(App)
    expect(wrapper.get('[data-output-dock] [data-desk="image"]').text()).toContain(en.dock.image)
    expect(wrapper.get('[data-output-dock] [data-desk="video"]').text()).toContain(en.dock.video)
    expect(wrapper.get('[data-nav="settings"]').text()).toBe(en.nav.settings)
    expect(wrapper.get('[data-nav="about"]').text()).toBe(en.nav.about)
    expect(wrapper.text()).toContain(en.panel.shape)
    expect(wrapper.text()).toContain(en.animations.title)
    expect(wrapper.text()).toContain(en.settings.title)
    expect(wrapper.text()).toContain(en.settings.language)
    expect(wrapper.text()).toContain(en.settings.theme)
    expect(wrapper.get('[data-locale="en"]').text()).toContain('English')
    expect(wrapper.get('[data-locale="fr"]').text()).toContain('Français')
    expect(wrapper.get('[data-locale="zh"]').text()).toContain('简体中文')
  })

  it('switches nav and settings copy to French and persists the locale', async () => {
    const wrapper = mount(App)
    await wrapper.get('[data-locale="fr"]').trigger('click')

    expect(wrapper.get('[data-nav="settings"]').text()).toBe(fr.nav.settings)
    expect(wrapper.get('[data-nav="about"]').text()).toBe(fr.nav.about)
    expect(wrapper.get('[data-output-dock] [data-desk="video"]').text()).toContain(fr.dock.video)
    expect(wrapper.text()).toContain(fr.panel.shape)
    expect(wrapper.text()).toContain(fr.animations.title)
    expect(wrapper.text()).toContain(fr.settings.language)
    expect(window.localStorage.getItem(cle('langue'))).toBe('fr')
    expect(document.documentElement.lang).toBe('fr')
  })

  it('switches copy to Simplified Chinese', async () => {
    const wrapper = mount(App)
    await wrapper.get('[data-locale="zh"]').trigger('click')

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

describe('output dock', () => {
  beforeEach(() => {
    history.replaceState(null, '', '/')
    window.localStorage.clear()
    rechargerLangue()
    langue.value = 'en'
  })

  afterEach(() => {
    history.replaceState(null, '', '/')
  })

  it('opens on the image desk with no timeline and still-only exports', () => {
    const wrapper = mount(App)
    expect(wrapper.get('#studio').attributes('data-desk')).toBe('image')
    expect(wrapper.find('[data-timeline]').exists()).toBe(false)
    expect(wrapper.find('[data-export="png"]').exists()).toBe(true)
    expect(wrapper.find('[data-export="svg"]').exists()).toBe(true)
    expect(wrapper.find('[data-export="gif"]').exists()).toBe(false)
    expect(location.search).toBe('?desk=image')
    wrapper.unmount()
  })

  it('shows the timeline and motion exports only on the video desk', async () => {
    const wrapper = mount(App)
    await toVideo(wrapper)

    expect(wrapper.get('#studio').attributes('data-desk')).toBe('video')
    expect(wrapper.find('[data-timeline]').exists()).toBe(true)
    expect(wrapper.find('[data-export="gif"]').exists()).toBe(true)
    expect(wrapper.find('[data-export="png"]').exists()).toBe(false)
    expect(location.search).toBe('?desk=video')
    expect(wrapper.get('[data-desk="video"]').attributes('aria-current')).toBe('page')
    wrapper.unmount()
  })

  it('keeps each desk look independent across a switch', async () => {
    const wrapper = mount(App)
    await wrapper.get('[data-mode="shape"]').trigger('click')
    await wrapper.get('[data-customise-panel] [data-shape="hexagon"]').trigger('click')

    await toVideo(wrapper)
    expect(wrapper.get('#studio svg[role="img"]').attributes('data-shape')).toBe('circle')
    await wrapper.get('[data-mode="colour"]').trigger('click')
    await wrapper.get('[data-customise-panel] [data-colour="blue"]').trigger('click')

    await wrapper.get('[data-output-dock] [data-desk="image"]').trigger('click')
    await flushPromises()
    const svg = wrapper.get('#studio svg[role="img"]')
    expect(svg.attributes('data-shape')).toBe('hexagon')
    expect(svg.attributes('data-colour')).toBe('ink')

    expect(stored()?.image.look).toMatchObject({ shape: 'hexagon', colour: 'ink' })
    expect(stored()?.video.look).toMatchObject({ shape: 'circle', colour: 'blue' })
    wrapper.unmount()
  })

  it('restores the focused desk from ?desk= on load', () => {
    history.replaceState(null, '', '/?desk=video')
    const wrapper = mount(App)
    expect(wrapper.get('#studio').attributes('data-desk')).toBe('video')
    expect(wrapper.find('[data-timeline]').exists()).toBe(true)
    wrapper.unmount()
  })
})

describe('theme', () => {
  beforeEach(() => {
    history.replaceState(null, '', '/')
    window.localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    rechargerLangue()
    langue.value = 'en'
  })

  it('paints the chrome and persists an explicit choice', async () => {
    const wrapper = mount(App)
    await wrapper.get('[data-theme-choice="dark"]').trigger('click')

    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(stored()?.theme).toBe('dark')
    expect(wrapper.get('[data-theme-choice="dark"]').attributes('aria-checked')).toBe('true')

    await wrapper.get('[data-theme-choice="light"]').trigger('click')
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(stored()?.theme).toBe('light')
    wrapper.unmount()
  })

  it('restores a stored theme on load and leaves the avatar paper alone', () => {
    const doc = defaultStudioDoc()
    saveDoc({ ...doc, theme: 'dark' })
    const wrapper = mount(App)
    expect(document.documentElement.dataset.theme).toBe('dark')
    // The eye cut-outs reveal this paper, so it stays canonical light in dark mode.
    expect(wrapper.get('#studio [data-body-paper]').attributes('fill')).toBe('#f5f5f4')
    wrapper.unmount()
  })
})

describe('delivery', () => {
  beforeEach(() => {
    history.replaceState(null, '', '/')
    window.localStorage.clear()
    rechargerLangue()
    langue.value = 'en'
    exporte.mockClear()
    exporteMontage.mockClear()
  })

  afterEach(() => {
    history.replaceState(null, '', '/')
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

  it('exports the video desk montage as a GIF', async () => {
    const wrapper = mount(App)
    await toVideo(wrapper)
    await wrapper.get('[data-export="gif"]').trigger('click')
    await flushPromises()

    expect(exporteMontage).toHaveBeenCalledOnce()
    expect(exporte).not.toHaveBeenCalled()
    const [format, cycle, reglages, nom] = exporteMontage.mock.calls[0]!
    expect(format).toBe('gif')
    expect(cycle.blocks).toEqual([{ state: 'Idle', duration: 2 }])
    expect(reglages).toMatchObject({ shape: 'circle', colour: 'ink', expression: 'neutral' })
    expect(nom).toBe(en.cycles.defaultName)
    expect(wrapper.get('[data-export-status]').text()).toBe(en.export.done)
    wrapper.unmount()
  })

  it('exports a single-pose cycle seeded from the palette', async () => {
    const wrapper = mount(App)
    await toVideo(wrapper)
    await wrapper.get('[data-mode="state"]').trigger('click')
    await wrapper.get('[data-animations-palette] [data-state="Comet"]').trigger('click')
    await wrapper.get('[data-cycle-new]').trigger('click')
    await wrapper.get('[data-cycle-form]').trigger('submit')
    await flushPromises()
    await wrapper.get('[data-export="gif"]').trigger('click')
    await flushPromises()

    const [, cycle] = exporteMontage.mock.calls[0]!
    expect(cycle.blocks.map((b) => b.state)).toEqual(['Comet'])
    wrapper.unmount()
  })

  it('reports export progress and treats cancellation as neutral', async () => {
    exporteMontage.mockImplementationOnce(
      (_format, _cycle, _reglages, _nom, avance, signal) =>
        new Promise<void>((_resolve, reject) => {
          avance?.(1, 2)
          signal?.addEventListener('abort', () => reject(new Abandon()), { once: true })
        }),
    )
    const wrapper = mount(App)
    await toVideo(wrapper)
    await wrapper.get('[data-export="gif"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[data-export-status]').text()).toContain('50%')
    await wrapper.get('[data-export-cancel]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-export-status]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('gates MP4 when the browser cannot encode video', async () => {
    const { videoPossible } = await import('../ui/export')
    const wrapper = mount(App)
    await toVideo(wrapper)
    const mp4 = wrapper.get('[data-export="mp4"]')
    if (videoPossible()) {
      expect(mp4.attributes('disabled')).toBeUndefined()
    } else {
      expect(mp4.attributes('disabled')).toBeDefined()
    }
    wrapper.unmount()
  })
})

describe('pose sharing', () => {
  beforeEach(() => {
    history.replaceState(null, '', '/')
    window.localStorage.clear()
    rechargerLangue()
    langue.value = 'en'
  })

  afterEach(() => {
    history.replaceState(null, '', '/')
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
    expect(
      wrapper.get('[data-animations-palette] [data-state="Thinking"]').attributes('aria-checked'),
    ).toBe('true')
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

  it('applies a later #etat= change without the desk switcher clobbering it', async () => {
    const wrapper = mount(App)

    history.replaceState(null, '', '?desk=image#etat=orbit&stop')
    window.dispatchEvent(new HashChangeEvent('hashchange'))
    await flushPromises()

    expect(wrapper.get('#studio svg[role="img"]').attributes('data-target')).toBe('Orbit')
    expect(location.hash).toBe('#etat=orbit&stop')

    await toVideo(wrapper)
    expect(location.search).toBe('?desk=video')
    expect(location.hash).toBe('#etat=idle&stop')

    await wrapper.get('[data-output-dock] [data-desk="image"]').trigger('click')
    await flushPromises()
    expect(location.hash).toBe('#etat=orbit&stop')
    wrapper.unmount()
  })

  it('shares the video desk pose while the transport is stopped', async () => {
    const wrapper = mount(App)
    await toVideo(wrapper)
    await wrapper.get('[data-mode="state"]').trigger('click')
    await wrapper.get('[data-animations-palette] [data-state="Comet"]').trigger('click')
    expect(location.hash).toBe('#etat=comet&stop')

    await wrapper.get('[data-play]').trigger('click')
    expect(location.hash).toBe('#etat=comet')

    const desk = wrapper.getComponent(Timeline).props('desk')
    expect(desk.transport.playing.value).toBe(true)
    wrapper.unmount()
  })
})
