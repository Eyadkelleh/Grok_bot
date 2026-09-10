/**
 * Chrome accent from the committed bot colour.
 *
 * `--bot-accent` is the engine hex. `displayHex` is a contrast-safe tint for
 * ink, cream, and similarly extreme custom colours. The bot's rendered fill
 * is never rewritten here.
 */

import { COLOR_BY_ID, DEFAULT_COLOR, resolveColour, type ColorId } from '../engine'

export interface ChromeAccent {
  /** The exact committed bot colour used by the engine. */
  sourceHex: `#${string}`
  /** A contrast-safe display tint for chrome glow and thin markers. */
  displayHex: `#${string}`
  rgb: readonly [red: number, green: number, blue: number]
  contrastHex: '#000000' | '#ffffff'
  cssVars: Readonly<{
    '--bot-accent': string
    '--bot-accent-rgb': string
    '--accent-contrast': string
    '--accent-display': string
  }>
}

type Rgb = readonly [red: number, green: number, blue: number]

/** Ink sits far below this. Brown and every other catalogue stop stay above it. */
const DISPLAY_LUMINANCE_MIN = 0.12
/** Cream sits far above this. Amber and every other catalogue stop stay below it. */
const DISPLAY_LUMINANCE_MAX = 0.72

export function resolveChromeAccent(colour: ColorId | `#${string}`): ChromeAccent {
  const named = COLOR_BY_ID.get(colour)
  const sourceHex = formatHex(parseRgb(named?.hex ?? resolveColour(colour)) ?? fallbackRgb())
  const rgb = parseRgb(sourceHex) ?? fallbackRgb()
  const displayHex = formatHex(displayTint(rgb))
  const contrastHex = contrastOn(rgb)

  return {
    sourceHex,
    displayHex,
    rgb,
    contrastHex,
    cssVars: {
      '--bot-accent': sourceHex,
      '--bot-accent-rgb': `${rgb[0]} ${rgb[1]} ${rgb[2]}`,
      '--accent-contrast': contrastHex,
      '--accent-display': displayHex,
    },
  }
}

function fallbackRgb(): Rgb {
  const parsed = parseRgb(COLOR_BY_ID.get(DEFAULT_COLOR)?.hex ?? resolveColour(DEFAULT_COLOR))
  if (!parsed) throw new Error(`engine default colour is not hex: ${DEFAULT_COLOR}`)
  return parsed
}

function parseRgb(hex: string | undefined): Rgb | null {
  if (!hex) return null
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim())
  if (!match) return null
  let digits = match[1]!
  if (digits.length === 3) digits = digits.replace(/./g, (ch) => ch + ch)
  const n = Number.parseInt(digits, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function formatHex(rgb: Rgb): `#${string}` {
  return `#${rgb.map((n) => n.toString(16).padStart(2, '0')).join('')}` as `#${string}`
}

function displayTint(source: Rgb): Rgb {
  const light = luminance(source)
  if (light >= DISPLAY_LUMINANCE_MIN && light <= DISPLAY_LUMINANCE_MAX) return source
  const towardHex =
    light < DISPLAY_LUMINANCE_MIN
      ? COLOR_BY_ID.get('cream')?.hex
      : COLOR_BY_ID.get('ink')?.hex
  const toward = parseRgb(towardHex) ?? fallbackRgb()
  const towardLight = luminance(toward)
  const span = towardLight - light
  if (span === 0) return source
  const target = light < DISPLAY_LUMINANCE_MIN ? DISPLAY_LUMINANCE_MIN : DISPLAY_LUMINANCE_MAX
  const t = (target - light) / span
  return mix(source, toward, t)
}

function mix(a: Rgb, b: Rgb, t: number): Rgb {
  const k = t < 0 ? 0 : t > 1 ? 1 : t
  return [
    Math.round(a[0] + (b[0] - a[0]) * k),
    Math.round(a[1] + (b[1] - a[1]) * k),
    Math.round(a[2] + (b[2] - a[2]) * k),
  ]
}

function contrastOn(rgb: Rgb): '#000000' | '#ffffff' {
  return luminance(rgb) > 0.179 ? '#000000' : '#ffffff'
}

function luminance(rgb: Rgb): number {
  const [r, g, b] = rgb.map(channel) as Rgb
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function channel(value: number): number {
  const s = value / 255
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}
