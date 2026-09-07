import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import App from '../App.vue'
import { brand } from '../brand'

describe('App', () => {
  it('renders the Grok_bot placeholder and a circle avatar', () => {
    const wrapper = mount(App)
    expect(wrapper.text()).toContain(brand.name)
    expect(wrapper.text()).toContain(brand.tagline)
    const circle = wrapper.get('svg[role="img"] circle')
    expect(circle.attributes('r')).toBe('46')
  })
})
