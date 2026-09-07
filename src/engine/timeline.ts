export const BASE_SCALE = 44
export const MIN_ZOOM = 0.45
export const MAX_ZOOM = 2.4

const TICK_SPACING = 52
const STEPS = [0.5, 1, 2, 5, 10, 15, 30, 60]
const MAX_TICKS = 2000

export function clampZoom(v: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, v))
}

/** `0:04` — tenths would flicker too fast to read. */
export function mmss(t: number) {
  const s = Math.max(0, Math.floor(t))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export function ticksFor(total: number, scale: number): Array<{ t: number; major: boolean }> {
  const major = STEPS.find((s) => s * scale >= TICK_SPACING) ?? STEPS[STEPS.length - 1]!
  const step = (major / 5) * scale >= 7 ? major / 5 : major
  const out: Array<{ t: number; major: boolean }> = []
  for (let i = 0; i * step <= total + 1e-6 && out.length < MAX_TICKS; i++) {
    const t = i * step
    out.push({ t, major: Math.abs(t / major - Math.round(t / major)) < 1e-6 })
  }
  return out
}
