import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import CustomisePanel from '../components/CustomisePanel.vue'
import { COLORS, EXPRESSIONS, SHAPES } from '../engine'
import en from '../i18n/locales/en'

describe('CustomisePanel', () => {
  const props = {
    shape: 'circle' as const,
    expression: 'neutral' as const,
    colour: 'ink' as const,
  }

  it('lists eight shapes, sixteen expressions, and twelve colours', () => {
    const wrapper = mount(CustomisePanel, { props })
    const shapes = wrapper.findAll('[data-shape]')
    const expressions = wrapper.findAll('[data-expression]')
    const colours = wrapper.findAll('[data-colour]')

    expect(shapes).toHaveLength(8)
    expect(expressions).toHaveLength(16)
    expect(colours).toHaveLength(12)
    expect(shapes.map((b) => b.attributes('data-shape'))).toEqual(SHAPES.map((s) => s.id))
    expect(expressions.map((b) => b.attributes('data-expression'))).toEqual(EXPRESSIONS.map((e) => e.id))
    expect(colours.map((b) => b.attributes('data-colour'))).toEqual(COLORS.map((c) => c.id))
    expect(wrapper.get('[data-shape="circle"]').attributes('aria-checked')).toBe('true')
    expect(wrapper.get('[data-expression="neutral"]').attributes('aria-checked')).toBe('true')
    expect(wrapper.get('[data-colour="ink"]').attributes('aria-checked')).toBe('true')
    expect(wrapper.get('[data-shape="circle"]').attributes('aria-label')).toBe(en.shapes.circle)
    expect(wrapper.get('[data-expression="happy"]').attributes('aria-label')).toBe(en.expressions.happy)
    expect(wrapper.get('[data-colour="blue"]').attributes('aria-label')).toBe(en.colors.blue)
  })

  it('emits the chosen shape, expression, and colour', async () => {
    const wrapper = mount(CustomisePanel, { props })

    await wrapper.get('[data-shape="hexagon"]').trigger('click')
    expect(wrapper.emitted('update:shape')?.[0]).toEqual(['hexagon'])

    await wrapper.get('[data-expression="happy"]').trigger('click')
    expect(wrapper.emitted('update:expression')?.[0]).toEqual(['happy'])

    await wrapper.get('[data-colour="blue"]').trigger('click')
    expect(wrapper.emitted('update:colour')?.[0]).toEqual(['blue'])
  })

  it('defaults to a grid and can lay out as a compact strip', () => {
    const grid = mount(CustomisePanel, { props })
    expect(grid.get('[data-customise-panel]').attributes('data-layout')).toBe('grid')
    expect(grid.get('[data-customise-panel]').classes()).not.toContain('compact')
    const compact = mount(CustomisePanel, { props: { ...props, layout: 'compact' } })
    expect(compact.get('[data-customise-panel]').attributes('data-layout')).toBe('compact')
    expect(compact.get('[data-customise-panel]').classes()).toContain('compact')
  })
})
