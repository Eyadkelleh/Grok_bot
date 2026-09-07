export const TAU = Math.PI * 2

export function clamp(v: number, lo = 0, hi = 1): number {
  return v < lo ? lo : v > hi ? hi : v
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function easeOutQuint(t: number): number {
  return 1 - (1 - t) ** 5
}

export function r2(v: number): number {
  return Math.round(v * 100) / 100
}
