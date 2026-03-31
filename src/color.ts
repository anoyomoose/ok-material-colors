import {
  convert,
  hexToRGB,
  RGBToHex,
  sRGB,
  sRGBLinear,
  OKLCH,
  OKHSL,
  gamutMapOKLCH,
  sRGBGamut,
} from '@texel/color'

// ── Internal types (float space) ─────────────────────────────────────

export interface OkHSL {
  h: number  // hue 0-360
  s: number  // saturation 0-1
  l: number  // lightness 0-1
}

export interface OkLCH {
  l: number  // lightness 0-1
  c: number  // chroma 0-~0.4
  h: number  // hue 0-360
}

// Reusable scratch arrays to avoid allocations in hot paths
const _tmp3a: number[] = [0, 0, 0]
const _tmp3b: number[] = [0, 0, 0]
const _tmp3c: number[] = [0, 0, 0]

// ── Parsing (hex boundary → float space) ─────────────────────────────

export function parseHex(hex: string): OkHSL {
  const norm = hex.startsWith('#') ? hex : `#${hex}`
  const rgb = hexToRGB(norm, _tmp3a)
  const hsl = convert(rgb, sRGB, OKHSL, _tmp3b)
  return { h: hsl[0], s: hsl[1], l: hsl[2] }
}

export function parseHexToLch(hex: string): OkLCH {
  const norm = hex.startsWith('#') ? hex : `#${hex}`
  const rgb = hexToRGB(norm, _tmp3a)
  const lch = convert(rgb, sRGB, OKLCH, _tmp3b)
  return { l: lch[0], c: lch[1], h: lch[2] }
}

// ── Formatting (float space → hex boundary) ──────────────────────────

export function formatHex(color: OkHSL): string {
  const rgb = convert([color.h, color.s, color.l], OKHSL, sRGB, _tmp3a)
  // OkHSL is sRGB-gamut-aware, but clamp for floating point safety
  rgb[0] = Math.max(0, Math.min(1, rgb[0]))
  rgb[1] = Math.max(0, Math.min(1, rgb[1]))
  rgb[2] = Math.max(0, Math.min(1, rgb[2]))
  return RGBToHex(rgb)
}

export function formatLchHex(color: OkLCH): string {
  const rgb = gamutMapOKLCH([color.l, color.c, color.h], sRGBGamut, sRGB, _tmp3a)
  return RGBToHex(rgb)
}

// ── Internal conversions (float → float, no hex) ────────────────────

export function hslToLch(hsl: OkHSL): OkLCH {
  const lch = convert([hsl.h, hsl.s, hsl.l], OKHSL, OKLCH, _tmp3a)
  return { l: lch[0], c: lch[1], h: lch[2] }
}

export function lchToHsl(lch: OkLCH): OkHSL {
  const hsl = convert([lch.l, lch.c, lch.h], OKLCH, OKHSL, _tmp3a)
  return { h: hsl[0], s: hsl[1], l: hsl[2] }
}

// ── Contrast ────────────────────────────────────────────────────────

/**
 * Relative luminance from OkLCH via linear RGB (no 8-bit quantization).
 * Uses gamut-mapped linear sRGB to ensure valid values.
 */
function luminanceFromLch(color: OkLCH): number {
  const lrgb = gamutMapOKLCH(
    [color.l, color.c, color.h],
    sRGBGamut,
    sRGBLinear,
    _tmp3c,
  )
  // Y = 0.2126R + 0.7152G + 0.0722B (sRGB luminance coefficients on linear RGB)
  return 0.2126 * lrgb[0] + 0.7152 * lrgb[1] + 0.0722 * lrgb[2]
}

/** WCAG 2.1 contrast ratio between two OkLCH colors. */
export function contrastRatio(a: OkLCH, b: OkLCH): number {
  const lA = luminanceFromLch(a)
  const lB = luminanceFromLch(b)
  const lighter = Math.max(lA, lB)
  const darker = Math.min(lA, lB)
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Binary search for OkHSL lightness that achieves targetRatio against a background.
 * Returns lightness in [0, 1].
 * `preferLighter`: true = search toward white, false = search toward black.
 */
export function findLightnessForContrast(
  h: number,
  s: number,
  bgLch: OkLCH,
  targetRatio: number,
  preferLighter: boolean,
): number {
  let lo: number
  let hi: number
  if (preferLighter) {
    lo = bgLch.l
    hi = 1.0
  } else {
    lo = 0.0
    hi = bgLch.l
  }

  // 20 iterations of binary search → precision of ~1e-6 in L
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2
    const hsl: OkHSL = { h, s, l: mid }
    const lch = hslToLch(hsl)
    const ratio = contrastRatio(lch, bgLch)

    if (ratio >= targetRatio) {
      // We have enough contrast; move toward bg to find the minimum L that works
      if (preferLighter) {
        hi = mid
      } else {
        lo = mid
      }
    } else {
      // Not enough contrast; move away from bg
      if (preferLighter) {
        lo = mid
      } else {
        hi = mid
      }
    }
  }

  return preferLighter ? hi : lo
}

// ── Harmonization (float space) ─────────────────────────────────────

/** Shortest signed angular difference from a to b, in [-180, 180]. */
function angleDiff(a: number, b: number): number {
  return ((b - a) % 360 + 540) % 360 - 180
}

/** Sanitize degrees to [0, 360). */
export function sanitizeDegrees(d: number): number {
  return ((d % 360) + 360) % 360
}

/**
 * Rotate `design` hue toward `source` hue by up to `maxShift` degrees (default 15).
 * Preserves saturation and lightness.
 */
export function harmonizeHsl(
  design: OkHSL,
  source: OkHSL,
  maxShift: number = 15,
): OkHSL {
  const diff = angleDiff(design.h, source.h)
  const shift = Math.sign(diff) * Math.min(Math.abs(diff) * 0.5, maxShift)
  return {
    h: sanitizeDegrees(design.h + shift),
    s: design.s,
    l: design.l,
  }
}

// ── Lightness scale conversion ───────────────────────────────────────

/**
 * Convert CIE L-star (0-100 scale used by Google's HCT tones) to OkLab lightness (0-1).
 * Token definitions use L-star/100 values (0-1 range) — this converts them to
 * OkLab L for use with OkLCH/OkHSL tonal palettes.
 *
 * Path: L-star -> Y (relative luminance) -> sRGB gray -> OkLCH -> L
 */
export function lstarToOkL(lstar100: number): number {
  // lstar100 is L*/100 (0-1 range), convert to L* (0-100)
  const lstar = lstar100 * 100
  if (lstar <= 0) return 0
  if (lstar >= 100) return 1

  // L* to Y (relative luminance)
  let y: number
  if (lstar <= 8) {
    y = lstar / 903.3
  } else {
    y = ((lstar + 16) / 116) ** 3
  }

  // Y to sRGB gamma-encoded gray
  let gray: number
  if (y <= 0.0031308) {
    gray = 12.92 * y
  } else {
    gray = 1.055 * (y ** (1 / 2.4)) - 0.055
  }
  gray = Math.max(0, Math.min(1, gray))

  // sRGB gray to OkLCH L
  const oklch = convert([gray, gray, gray], sRGB, OKLCH, _tmp3a)
  return oklch[0]
}

// ── Utility ─────────────────────────────────────────────────────────

/**
 * Get OkLCH chroma at reference lightness L=0.5 for a given hue and OkHSL saturation.
 * This is the "intended colorfulness" used to build tonal palettes.
 */
export function referenceChroma(h: number, s: number): number {
  const lch = convert([h, s, 0.5], OKHSL, OKLCH, _tmp3a)
  return lch[1] // chroma component
}
