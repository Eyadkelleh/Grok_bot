import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import App from '../App.vue'
import { brand } from '../brand'

describe('App', () => {
  it('renders the Grok_bot placeholder and a morphing avatar', () => {
    const wrapper = mount(App)
    expect(wrapper.text()).toContain(brand.name)
    expect(wrapper.text()).toContain(brand.tagline)
    const svg = wrapper.get('svg[role="img"]')
    expect(svg.attributes('data-state')).toBe('Idle')
    const path = svg.get('path')
    expect(path.attributes('d')?.startsWith('M')).toBe(true)
  })

  it('morphs Idle to Thinking from the demo control', async () => {
    const wrapper = mount(App)
    const button = wrapper.get('button')
    expect(button.text()).toMatch(/thinking/i)
    await button.trigger('click')
    expect(wrapper.get('svg[role="img"]').attributes('data-target')).toBe('Thinking')
    expect(button.text()).toMatch(/idle/i)
  })
})
