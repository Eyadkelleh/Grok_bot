import { mount } from '@vue/test-utils'
import Avatar from '../../components/Avatar.vue'
import type { Block } from '../../engine'
import type { VisualCase } from './types'

type AvatarExposed = {
  rendAt: (t: number, blocks: Block[]) => void
}

export async function mountCase(visualCase: VisualCase) {
  const wrapper = mount(Avatar, {
    props: { durationMs: 0, ...visualCase.props },
  })
  if (visualCase.seek) {
    ;(wrapper.vm as unknown as AvatarExposed).rendAt(visualCase.seek.at, [...visualCase.seek.blocks])
    await wrapper.vm.$nextTick()
  }
  return wrapper
}
