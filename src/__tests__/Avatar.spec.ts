import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Avatar from '../components/Avatar.vue'
import {
  COLOR_BY_ID,
  DEFAULT_COLOR,
  DEFAULT_EXPRESSION,
  DEFAULT_SHAPE,
  DEFAULT_SIZE,
  REST_GAZE,
  pathForState,
  sampleAvatar,
} from '../engine'

describe('Avatar', () => {
  it('defaults to a 220px idle circle with the rest gaze', () => {
    const wrapper = mount(Avatar)
    const svg = wrapper.get('svg')
    expect(svg.attributes('width')).toBe(String(DEFAULT_SIZE))
    expect(svg.attributes('height')).toBe(String(DEFAULT_SIZE))
    expect(svg.attributes('data-shape')).toBe(DEFAULT_SHAPE)
    expect(svg.attributes('data-expression')).toBe(DEFAULT_EXPRESSION)
    expect(svg.attributes('data-colour')).toBe(DEFAULT_COLOR)
    expect(svg.attributes('data-state')).toBe('Idle')
    expect(svg.attributes('data-shape-applied')).toBe('true')
    expect(svg.attributes('data-geometry-kind')).toBe('wearable')
    expect(svg.attributes('data-gaze')).toBe(`${REST_GAZE.yaw},${REST_GAZE.pitch},${REST_GAZE.roll}`)
    expect(wrapper.get('[data-body]').attributes('fill')).toBe(COLOR_BY_ID.get('ink')?.hex)
    expect(wrapper.findAll('[data-eye]')).toHaveLength(2)
  })

  it('honours size, shape, expression, gaze, and colour props', async () => {
    const wrapper = mount(Avatar, {
      props: {
        size: 96,
        shape: 'hexagon',
        expression: 'happy',
        gaze: { yaw: -12, pitch: 4, roll: 8 },
        colour: 'blue',
        label: 'Studio bot',
      },
    })

    const svg = wrapper.get('svg')
    expect(svg.attributes('width')).toBe('96')
    expect(svg.attributes('height')).toBe('96')
    expect(svg.attributes('aria-label')).toBe('Studio bot')
    expect(svg.attributes('data-size')).toBe('96')
    expect(svg.attributes('data-shape')).toBe('hexagon')
    expect(svg.attributes('data-expression')).toBe('happy')
    expect(svg.attributes('data-colour')).toBe('blue')
    expect(svg.attributes('data-gaze')).toBe('-12,4,8')
    expect(wrapper.get('[data-body]').attributes('fill')).toBe(COLOR_BY_ID.get('blue')?.hex)

    const circlePath = sampleAvatar({ shape: 'circle' }).path
    expect(wrapper.get('path').attributes('d')).not.toBe(circlePath)

    await wrapper.setProps({ colour: '#ff00aa', gaze: 0, shape: 'triangle', expression: 'angry' })
    expect(wrapper.get('[data-body]').attributes('fill')).toBe('#ff00aa')
    expect(svg.attributes('data-gaze')).toBe('0,7,0')
    expect(svg.attributes('data-shape')).toBe('triangle')
    expect(svg.attributes('data-expression')).toBe('angry')
  })

  it('moves the eyes when gaze changes', async () => {
    const wrapper = mount(Avatar, { props: { gaze: 0 } })
    const left = wrapper.get('[data-eye]')
    const before = left.attributes('transform')

    await wrapper.setProps({ gaze: 40 })
    expect(wrapper.get('[data-eye]').attributes('transform')).not.toBe(before)
  })

  it('renders Thinking as two dots without eyes', () => {
    const wrapper = mount(Avatar, { props: { state: 'Thinking', colour: 'red', durationMs: 0 } })
    expect(wrapper.findAll('[data-eye]')).toHaveLength(0)
    expect(wrapper.findAll('[data-dot]')).toHaveLength(2)
    expect(wrapper.get('[data-dot]').attributes('fill')).toBe(COLOR_BY_ID.get('red')?.hex)
    expect(wrapper.get('svg').attributes('data-state')).toBe('Thinking')
  })

  it('morphs Idle to Thinking when the state prop changes', async () => {
    const wrapper = mount(Avatar, { props: { durationMs: 0 } })
    const idlePath = wrapper.get('svg path').attributes('d')
    expect(wrapper.get('svg').attributes('data-state')).toBe('Idle')
    expect(wrapper.findAll('[data-dot]')).toHaveLength(0)

    await wrapper.setProps({ state: 'Thinking' })

    expect(wrapper.get('svg').attributes('data-state')).toBe('Thinking')
    expect(wrapper.get('svg').attributes('data-target')).toBe('Thinking')
    expect(wrapper.get('svg path').attributes('d')).not.toBe(idlePath)
    expect(wrapper.findAll('[data-dot]')).toHaveLength(2)
  })

  it('morphs between customiser shapes when the shape prop changes', async () => {
    let nextFrame: FrameRequestCallback | undefined
    const now = vi.spyOn(performance, 'now').mockReturnValue(0)
    const requestFrame = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback) => {
        nextFrame = callback
        return 1
      })
    const wrapper = mount(Avatar, {
      props: { durationMs: 400, state: 'Idle', shape: 'circle' },
    })
    const circle = sampleAvatar({ state: 'Idle', shape: 'circle' }).path
    const hexagon = sampleAvatar({ state: 'Idle', shape: 'hexagon' }).path

    await wrapper.setProps({ shape: 'hexagon' })
    nextFrame?.(200)
    await wrapper.vm.$nextTick()

    const path = wrapper.get('svg path').attributes('d')
    expect(path).not.toBe(circle)
    expect(path).not.toBe(hexagon)
    expect(wrapper.get('svg').attributes('data-shape')).toBe('hexagon')

    wrapper.unmount()
    requestFrame.mockRestore()
    now.mockRestore()
  })

  it('morphs to Comet from a palette-driven state', async () => {
    const wrapper = mount(Avatar, { props: { durationMs: 0, state: 'Idle' } })
    await wrapper.setProps({ state: 'Comet' })
    expect(wrapper.get('svg').attributes('data-state')).toBe('Comet')
    expect(wrapper.get('svg').attributes('data-shape-applied')).toBe('true')
    expect(wrapper.get('svg path').attributes('d')).toBe(pathForState('Comet'))
  })

  it('marks symbol poses as not applying the customiser shape', () => {
    const wrapper = mount(Avatar, { props: { state: 'Play', shape: 'hexagon', durationMs: 0 } })
    expect(wrapper.get('svg').attributes('data-shape')).toBe('hexagon')
    expect(wrapper.get('svg').attributes('data-shape-applied')).toBe('false')
    expect(wrapper.get('svg').attributes('data-geometry-kind')).toBe('symbol')
    expect(wrapper.get('svg path').attributes('d')).toBe(pathForState('Play'))
  })

  it('seeks a montage date without morphing in from a state that was never shown', async () => {
    const wrapper = mount(Avatar, { props: { durationMs: 400 } })
    const blocs = [
      { state: 'Comet' as const, duration: 2 },
      { state: 'Thinking' as const, duration: 2 },
    ]
    wrapper.vm.rendAt(0, blocs)
    await wrapper.vm.$nextTick()
    expect(wrapper.get('svg').attributes('data-state')).toBe('Comet')
    expect(wrapper.get('svg').attributes('data-target')).toBe('Comet')
    expect(wrapper.get('svg path').attributes('d')).toBe(pathForState('Comet'))

    wrapper.vm.rendAt(2.4, blocs)
    await wrapper.vm.$nextTick()
    expect(wrapper.get('svg').attributes('data-state')).toBe('Thinking')
    expect(wrapper.get('svg').attributes('data-target')).toBe('Thinking')
  })
})
