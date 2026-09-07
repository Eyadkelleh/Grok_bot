import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AvatarMorph from '../components/AvatarMorph.vue'
import { pathForState } from '../engine'

describe('AvatarMorph', () => {
  it('morphs Idle to Thinking when the state prop changes', async () => {
    const wrapper = mount(AvatarMorph, { props: { durationMs: 0 } })
    const idlePath = wrapper.get('svg path').attributes('d')
    expect(wrapper.get('svg').attributes('data-state')).toBe('Idle')
    expect(wrapper.findAll('svg circle')).toHaveLength(0)

    await wrapper.setProps({ state: 'Thinking' })

    expect(wrapper.get('svg').attributes('data-state')).toBe('Thinking')
    expect(wrapper.get('svg').attributes('data-target')).toBe('Thinking')
    expect(wrapper.get('svg path').attributes('d')).not.toBe(idlePath)
    expect(wrapper.findAll('svg circle')).toHaveLength(2)
  })

  it('morphs to Comet from the palette-driven state', async () => {
    const wrapper = mount(AvatarMorph, { props: { durationMs: 0, state: 'Idle' } })
    await wrapper.setProps({ state: 'Comet' })
    expect(wrapper.get('svg').attributes('data-state')).toBe('Comet')
    expect(wrapper.get('svg path').attributes('d')).toBe(pathForState('Comet'))
  })
})
