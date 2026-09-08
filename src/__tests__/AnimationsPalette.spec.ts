import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import AnimationsPalette from '../components/AnimationsPalette.vue'
import { ANIMATION_STATES } from '../engine'
import en from '../i18n/locales/en'

describe('AnimationsPalette', () => {
  it('lists every catalogue state as a selectable swatch', () => {
    const wrapper = mount(AnimationsPalette, { props: { modelValue: 'Idle' } })
    const buttons = wrapper.findAll('[data-state]')
    expect(buttons).toHaveLength(ANIMATION_STATES.length)
    expect(buttons.map((b) => b.attributes('data-state'))).toEqual([...ANIMATION_STATES])
    expect(wrapper.get('[data-state="Idle"]').attributes('aria-checked')).toBe('true')
    expect(wrapper.get('[data-state="Idle"]').text()).toContain(en.animations.Idle)
  })

  it('emits the chosen state when a swatch is clicked', async () => {
    const wrapper = mount(AnimationsPalette, { props: { modelValue: 'Idle' } })
    await wrapper.get('[data-state="Comet"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['Comet'])
  })

  it('tints swatches with the selected colour', () => {
    const wrapper = mount(AnimationsPalette, { props: { modelValue: 'Idle', colour: 'blue' } })
    expect(wrapper.get('[data-state="Idle"] svg path').attributes('fill')).toBe('#3b93f0')
  })

  it('defaults to a grid and can lay out as a strip', () => {
    const grid = mount(AnimationsPalette, { props: { modelValue: 'Idle' } })
    expect(grid.get('[data-animations-palette]').attributes('data-layout')).toBe('grid')
    expect(grid.get('[data-animations-palette]').classes()).not.toContain('strip')
    const strip = mount(AnimationsPalette, { props: { modelValue: 'Idle', layout: 'strip' } })
    expect(strip.get('[data-animations-palette]').attributes('data-layout')).toBe('strip')
    expect(strip.get('[data-animations-palette]').classes()).toContain('strip')
  })
})
