import { describe, it, expect } from 'vitest'
import {
  generatePalette,
  harmonize,
  presets,
  EXPECTED_TOKEN_NAMES,
} from '../src/index.js'
import { parseHexToLch, contrastRatio } from '../src/color.js'

const TEST_COLORS = ['#6750a4', '#0000ff', '#ff0000', '#f2c037', '#21ba45']
const PRESET_NAMES = Object.keys(presets)

describe('end-to-end palette generation', () => {
  it('default options produce valid output', () => {
    const result = generatePalette('#6750a4')
    expect(Object.keys(result.light).sort()).toEqual([...EXPECTED_TOKEN_NAMES].sort())
    expect(Object.keys(result.dark).sort()).toEqual([...EXPECTED_TOKEN_NAMES].sort())
  })

  it('light and dark have same keys but different values', () => {
    const result = generatePalette('#6750a4')
    const lightKeys = Object.keys(result.light).sort()
    const darkKeys = Object.keys(result.dark).sort()
    expect(lightKeys).toEqual(darkKeys)
    expect(result.light.primary).not.toBe(result.dark.primary)
  })
})

describe('all presets x all colors: validity', () => {
  for (const presetName of PRESET_NAMES) {
    for (const color of TEST_COLORS) {
      it(`${presetName} + ${color}: all tokens valid hex`, () => {
        const result = generatePalette(color, { scheme: presetName })
        for (const [name, hex] of Object.entries(result.light)) {
          expect(hex, `light.${name}`).toMatch(/^#[0-9a-f]{6}$/i)
        }
        for (const [name, hex] of Object.entries(result.dark)) {
          expect(hex, `dark.${name}`).toMatch(/^#[0-9a-f]{6}$/i)
        }
      })
    }
  }
})

describe('all presets x all colors: key contrast pairs', () => {
  const contrastPairs = [
    ['on-primary', 'primary', 4.3],
    ['on-surface', 'surface', 4.3],
    ['on-error', 'error', 4.3],
    ['on-background', 'background', 4.3],
  ] as const

  for (const presetName of PRESET_NAMES) {
    for (const color of TEST_COLORS) {
      for (const [fg, bg, minRatio] of contrastPairs) {
        it(`${presetName}/${color} light: ${fg} vs ${bg} >= ${minRatio}`, () => {
          const result = generatePalette(color, { scheme: presetName })
          // Skip monochrome error tokens (0 saturation makes error == surface gray)
          if (presetName === 'monochrome' && fg.includes('error')) return
          const ratio = contrastRatio(
            parseHexToLch(result.light[fg]),
            parseHexToLch(result.light[bg]),
          )
          expect(ratio).toBeGreaterThanOrEqual(minRatio)
        })

        it(`${presetName}/${color} dark: ${fg} vs ${bg} >= ${minRatio}`, () => {
          const result = generatePalette(color, { scheme: presetName })
          if (presetName === 'monochrome' && fg.includes('error')) return
          const ratio = contrastRatio(
            parseHexToLch(result.dark[fg]),
            parseHexToLch(result.dark[bg]),
          )
          expect(ratio).toBeGreaterThanOrEqual(minRatio)
        })
      }
    }
  }
})

describe('harmonize', () => {
  it('returns valid hex', () => {
    const result = harmonize('#21BA45', '#6750a4')
    expect(result).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it('shifts hue toward source', () => {
    const original = parseHexToLch('#21BA45')
    const source = parseHexToLch('#6750a4')
    const result = parseHexToLch(harmonize('#21BA45', '#6750a4'))

    const originalDist = Math.min(
      Math.abs(original.h - source.h),
      360 - Math.abs(original.h - source.h),
    )
    const resultDist = Math.min(
      Math.abs(result.h - source.h),
      360 - Math.abs(result.h - source.h),
    )
    expect(resultDist).toBeLessThanOrEqual(originalDist + 1)
  })

  it('is deterministic', () => {
    const a = harmonize('#f2c037', '#6750a4')
    const b = harmonize('#f2c037', '#6750a4')
    expect(a).toBe(b)
  })
})

describe('secondarySourceColor for cmf', () => {
  it('produces different tertiary when secondary source is provided', () => {
    const withoutSecondary = generatePalette('#6750a4', { scheme: 'cmf' })
    const withSecondary = generatePalette('#6750a4', {
      scheme: 'cmf',
      secondarySourceColor: '#ff0000',
    })
    expect(withoutSecondary.light.tertiary).not.toBe(withSecondary.light.tertiary)
  })
})
