import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'
import { DEFAULT_SIZE } from '../engine'

export const STAGE_SCALE = 0.72
export const STAGE_MIN = 240
export const STAGE_MAX = 720

export function stageSizeOf(width: number, height: number): number {
  const raw = Math.floor(Math.min(width, height) * STAGE_SCALE)
  if (raw <= 0) return DEFAULT_SIZE
  return Math.min(STAGE_MAX, Math.max(STAGE_MIN, raw))
}

export function useStageGeometry(target: Ref<HTMLElement | null>) {
  const size = ref(DEFAULT_SIZE)
  let observer: ResizeObserver | undefined

  function measure(width: number, height: number) {
    size.value = stageSizeOf(width, height)
  }

  onMounted(() => {
    const el = target.value
    if (!el) return
    measure(el.clientWidth, el.clientHeight)
    if (typeof ResizeObserver === 'undefined') return
    observer = new ResizeObserver((entries) => {
      const box = entries[0]?.contentRect
      if (!box) return
      measure(box.width, box.height)
    })
    observer.observe(el)
  })

  onBeforeUnmount(() => observer?.disconnect())

  return { size }
}
