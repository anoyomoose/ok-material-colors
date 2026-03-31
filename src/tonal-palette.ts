import {
  gamutMapOKLCH,
  sRGBGamut,
  OKLCH,
  MapToL,
} from '@texel/color'
import type { OkLCH } from './color.js'
import { referenceChroma, formatLchHex } from './color.js'

export interface TonalPalette {
  readonly hue: number
  readonly chroma: number
  at(lightness: number): OkLCH
  hexAt(lightness: number): string
}

/**
 * Create a tonal palette from OkHSL saturation.
 * Derives OkLCH chroma at reference L=0.5, then sweeps lightness in OkLCH.
 */
export function createTonalPalette(hue: number, saturation: number): TonalPalette {
  const chroma = referenceChroma(hue, saturation)
  return createTonalPaletteFromChroma(hue, chroma)
}

/**
 * Create a tonal palette from explicit OkLCH chroma.
 * Used for 'source' saturation mode where we preserve the source color's chroma.
 */
/**
 * Fade chroma to 0 at extreme lightness, matching HCT behavior where
 * tone 0 = black and tone 100 = white regardless of palette chroma.
 * Smooth fade in the range [0, fadeIn] and [1-fadeIn, 1].
 */
function chromaFade(lightness: number, fadeIn: number = 0.06): number {
  if (lightness <= 0) return 0
  if (lightness >= 1) return 0
  if (lightness < fadeIn) return lightness / fadeIn
  if (lightness > 1 - fadeIn) return (1 - lightness) / fadeIn
  return 1
}

export function createTonalPaletteFromChroma(hue: number, chroma: number): TonalPalette {
  const _tmp = [0, 0, 0]

  return {
    hue,
    chroma,

    at(lightness: number): OkLCH {
      // Fade chroma at extremes so L=0→black and L=1→white
      const effectiveChroma = chroma * chromaFade(lightness)
      // Gamut-map with MapToL: preserves lightness, reduces chroma to fit sRGB.
      // This maintains the intended lightness hierarchy (critical for surfaces)
      // rather than shifting lightness toward the cusp (MapToCuspL default).
      const mapped = gamutMapOKLCH([lightness, effectiveChroma, hue], sRGBGamut, OKLCH, _tmp, MapToL)
      return { l: mapped[0], c: mapped[1], h: mapped[2] }
    },

    hexAt(lightness: number): string {
      const lch = this.at(lightness)
      return formatLchHex(lch)
    },
  }
}
