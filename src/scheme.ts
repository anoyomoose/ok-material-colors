import type { OkHSL, OkLCH } from './color.js'
import {
  parseHex,
  parseHexToLch,
  hslToLch,
  formatLchHex,
  contrastRatio,
  sanitizeDegrees,
  lstarToOkL,
} from './color.js'
import { createTonalPalette, createTonalPaletteFromChroma } from './tonal-palette.js'
import type { TonalPalette } from './tonal-palette.js'
import { TOKEN_DEFS } from './tokens.js'
import type { PaletteRole, ContrastTarget } from './tokens.js'
import { presets } from './presets.js'
import type { SchemeConfig, RelativeSaturation } from './presets.js'

export interface PaletteTokens {
  light: Record<string, string>
  dark: Record<string, string>
}

export interface PaletteOptions {
  scheme?: SchemeConfig | string
  contrastLevel?: number
  secondarySourceColor?: string
}

/** Resolve saturation from config value + source OkHSL. */
function resolveSaturation(
  value: number | 'source' | RelativeSaturation,
  sourceS: number,
): number {
  if (value === 'source') return sourceS
  if (typeof value === 'number') return value
  // RelativeSaturation
  const raw = sourceS * value.factor + (value.offset ?? 0)
  const clamped = Math.max(0, Math.min(1, raw))
  return value.min !== undefined ? Math.max(value.min, clamped) : clamped
}

/** Interpolate a ContrastTarget at a given contrastLevel (-1 to 1). */
function interpolateContrast(ct: ContrastTarget, level: number): number {
  const clamped = Math.max(-1, Math.min(1, level))
  if (clamped <= 0) {
    const t = clamped + 1 // 0..1
    return ct.reduced + (ct.standard - ct.reduced) * t
  } else if (clamped <= 0.5) {
    const t = clamped * 2 // 0..1
    return ct.standard + (ct.medium - ct.standard) * t
  } else {
    const t = (clamped - 0.5) * 2 // 0..1
    return ct.medium + (ct.high - ct.medium) * t
  }
}

/**
 * Resolve 'complement' hue: sourceHue + 180°.
 * OkLCH hue is more uniform than CAM16, so straight 180° is a
 * reasonable approximation of Google's TemperatureCache.complement.
 */
function resolveComplementHue(sourceHue: number): number {
  return sanitizeDegrees(sourceHue + 180)
}

/**
 * Resolve 'analogous' hue: the 3rd color in a 6-division analogous set.
 * In OkLCH's uniform hue, this is approximately sourceHue + 60°.
 */
function resolveAnalogousHue(sourceHue: number): number {
  return sanitizeDegrees(sourceHue + 60)
}

/**
 * Binary search for lightness that achieves target contrast ratio,
 * probing the ACTUAL palette output (which includes gamut mapping).
 * Falls back to opposite direction if preferred direction can't achieve target.
 */
function findLightnessForContrastWithPalette(
  palette: TonalPalette,
  bgLch: OkLCH,
  targetRatio: number,
  preferLighter: boolean,
  startTone: number,
): number {
  function search(lighter: boolean): number {
    let lo: number, hi: number
    if (lighter) { lo = startTone; hi = 1.0 }
    else { lo = 0.0; hi = startTone }

    // Check if search range can achieve the target at all
    const extremeLch = palette.at(lighter ? 1.0 : 0.0)
    if (contrastRatio(extremeLch, bgLch) < targetRatio) return -1 // impossible

    for (let i = 0; i < 20; i++) {
      const mid = (lo + hi) / 2
      const probeLch = palette.at(mid)
      const ratio = contrastRatio(probeLch, bgLch)

      if (ratio >= targetRatio) {
        if (lighter) hi = mid; else lo = mid
      } else {
        if (lighter) lo = mid; else hi = mid
      }
    }
    return lighter ? hi : lo
  }

  // Try preferred direction first, fall back to opposite
  let result = search(preferLighter)
  if (result >= 0) return result
  result = search(!preferLighter)
  if (result >= 0) return result

  // If neither direction works on this palette (extreme chroma), return the
  // extreme lightness in the preferred direction — the caller will get the
  // best available contrast even if it doesn't meet the target
  return preferLighter ? 1.0 : 0.0
}

/**
 * When a high-chroma palette can't provide sufficient contrast at any lightness,
 * progressively reduce chroma until the target is met.
 * Returns the OkLCH color that meets the contrast target.
 */
function findContrastWithDesaturation(
  hue: number,
  startChroma: number,
  bgLch: OkLCH,
  targetRatio: number,
  preferLighter: boolean,
): OkLCH {
  // Binary search on chroma: find minimum chroma reduction needed
  let loC = 0
  let hiC = startChroma

  for (let i = 0; i < 15; i++) {
    const midC = (loC + hiC) / 2
    const tempPalette = createTonalPaletteFromChroma(hue, midC)

    // Check if this chroma allows meeting the target
    const extreme = tempPalette.at(preferLighter ? 1.0 : 0.0)
    if (contrastRatio(extreme, bgLch) >= targetRatio) {
      // This chroma works; try higher chroma (preserve more color)
      loC = midC
    } else {
      // Still can't meet target; reduce chroma more
      hiC = midC
    }
  }

  // Use the palette at the chroma we found, search for best lightness
  const palette = createTonalPaletteFromChroma(hue, loC)
  const result = findLightnessForContrastWithPalette(
    palette, bgLch, targetRatio, preferLighter, preferLighter ? 1.0 : 0.0,
  )
  return palette.at(result)
}

/** Build 6 tonal palettes from a SchemeConfig and source color. */
function buildPalettes(
  config: SchemeConfig,
  source: OkHSL,
  secondarySource?: OkHSL,
): Record<PaletteRole, TonalPalette> {
  const sourceHue = source.h
  const sourceS = source.s
  const sourceLch = hslToLch(source)

  function makePalette(
    hueOffset: number | 'complement' | 'analogous',
    satValue: number | 'source' | RelativeSaturation,
  ): TonalPalette {
    let hue: number
    if (hueOffset === 'complement') {
      hue = resolveComplementHue(sourceHue)
    } else if (hueOffset === 'analogous') {
      hue = resolveAnalogousHue(sourceHue)
    } else {
      hue = sanitizeDegrees(sourceHue + hueOffset)
    }

    if (satValue === 'source') {
      return createTonalPaletteFromChroma(hue, sourceLch.c)
    }

    const sat = resolveSaturation(satValue, sourceS)
    return createTonalPalette(hue, sat)
  }

  // Handle CMF secondary source override for tertiary
  let tertiaryPalette: TonalPalette
  if (secondarySource && config.name === 'cmf') {
    const secLch = hslToLch(secondarySource)
    tertiaryPalette = createTonalPaletteFromChroma(secondarySource.h, secLch.c)
  } else {
    tertiaryPalette = makePalette(config.tertiaryHueOffset, config.tertiarySaturation)
  }

  // errorHue is absolute (not relative to source), so use it directly
  const errorSat = resolveSaturation(config.errorSaturation, sourceS)
  const errorPalette = createTonalPalette(config.errorHue, errorSat)

  return {
    primary: makePalette(config.primaryHueOffset, config.primarySaturation),
    secondary: makePalette(config.secondaryHueOffset, config.secondarySaturation),
    tertiary: tertiaryPalette,
    neutral: makePalette(config.neutralHueOffset, config.neutralSaturation),
    neutralVariant: makePalette(config.neutralVariantHueOffset, config.neutralVariantSaturation),
    error: errorPalette,
  }
}

/** Generate tokens for one mode. */
function generateTokens(
  palettes: Record<PaletteRole, TonalPalette>,
  isDark: boolean,
  contrastLevel: number,
): Record<string, string> {
  const result: Record<string, string> = {}

  // First pass: generate all tokens at base lightness
  // Token tones are in L*/100 scale — convert to OkLab L for use with OkLCH palettes
  for (const def of TOKEN_DEFS) {
    const palette = palettes[def.palette]
    const baseTone = lstarToOkL(isDark ? def.darkTone : def.lightTone)
    result[def.name] = palette.hexAt(baseTone)
  }

  // Second pass: adjust tokens with contrast targets against their backgrounds
  for (const def of TOKEN_DEFS) {
    if (!def.contrastTarget || !def.background) continue

    const bgHex = result[def.background]
    const bgLch = parseHexToLch(bgHex)
    const targetRatio = interpolateContrast(def.contrastTarget, contrastLevel)

    const palette = palettes[def.palette]
    const baseTone = lstarToOkL(isDark ? def.darkTone : def.lightTone)
    const baseLch = palette.at(baseTone)
    const currentRatio = contrastRatio(baseLch, bgLch)

    if (currentRatio >= targetRatio) continue // Already meets target

    // Direction: if token is lighter than its background, search lighter; else darker
    const fgTone = isDark ? def.darkTone : def.lightTone
    const bgDef = TOKEN_DEFS.find(d => d.name === def.background)
    const bgTone = bgDef ? (isDark ? bgDef.darkTone : bgDef.lightTone) : 0.5
    const preferLighter = fgTone >= bgTone

    // Binary search using the ACTUAL palette (not achromatic) to account for
    // gamut mapping shifting lightness on chromatic colors
    const adjustedL = findLightnessForContrastWithPalette(
      palette,
      bgLch,
      targetRatio,
      preferLighter,
      baseTone,
    )

    // Check if the palette-based result achieves the target
    const adjustedLch = palette.at(adjustedL)
    if (contrastRatio(adjustedLch, bgLch) >= targetRatio) {
      result[def.name] = formatLchHex(adjustedLch)
    } else {
      // Palette chroma prevents sufficient contrast — progressively desaturate
      // by searching with a temporary lower-chroma palette
      const desatResult = findContrastWithDesaturation(
        palette.hue, palette.chroma, bgLch, targetRatio, preferLighter,
      )
      result[def.name] = formatLchHex(desatResult)
    }
  }

  return result
}

/** Main entry: generate light + dark palette from hex source color. */
export function generatePalette(
  hex: string,
  options?: PaletteOptions,
): PaletteTokens {
  const sourceHex = hex.startsWith('#') ? hex : `#${hex}`
  const source = parseHex(sourceHex)
  const contrastLevel = options?.contrastLevel ?? 0

  // Resolve scheme config
  let config: SchemeConfig
  if (!options?.scheme || typeof options.scheme === 'string') {
    const name = (typeof options?.scheme === 'string') ? options.scheme : 'tonalSpot'
    config = presets[name]
    if (!config) throw new Error(`Unknown preset: ${name}`)
  } else {
    config = options.scheme
  }

  // Parse secondary source color for CMF
  const secondarySource = options?.secondarySourceColor
    ? parseHex(options.secondarySourceColor)
    : undefined

  const palettes = buildPalettes(config, source, secondarySource)

  return {
    light: generateTokens(palettes, false, contrastLevel),
    dark: generateTokens(palettes, true, contrastLevel),
  }
}
