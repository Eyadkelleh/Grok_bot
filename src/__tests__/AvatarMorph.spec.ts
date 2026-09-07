import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AvatarMorph from '../components/AvatarMorph.vue'

describe('AvatarMorph', () => {
  it('morphs Idle to Thinking when the toggle is clicked', async () => {
    const wrapper = mount(AvatarMorph, { props: { durationMs: 0 } })
    const idlePath = wrapper.get('svg path').attributes('d')
    expect(wrapper.get('svg').attributes('data-state')).toBe('Idle')
    expect(wrapper.findAll('svg circle')).toHaveLength(0)

    await wrapper.get('button').trigger('click')

    expect(wrapper.get('svg').attributes('data-state')).toBe('Thinking')
    expect(wrapper.get('svg').attributes('data-target')).toBe('Thinking')
    expect(wrapper.get('svg path').attributes('d')).not.toBe(idlePath)
    expect(wrapper.findAll('svg circle')).toHaveLength(2)
  })
})
