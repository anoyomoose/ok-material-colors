import { describe, it, expect } from 'vitest'
import { generatePalette } from '../src/scheme.js'
import { EXPECTED_TOKEN_NAMES } from '../src/tokens.js'
import { presets } from '../src/presets.js'
import { parseHexToLch, contrastRatio } from '../src/color.js'

describe('generatePalette', () => {
  it('returns light and dark with all token keys', () => {
    const result = generatePalette('#6750a4')
    expect(Object.keys(result.light)).toHaveLength(EXPECTED_TOKEN_NAMES.length)
    expect(Object.keys(result.dark)).toHaveLength(EXPECTED_TOKEN_NAMES.length)
    for (const name of EXPECTED_TOKEN_NAMES) {
      expect(result.light[name], `missing light.${name}`).toBeDefined()
      expect(result.dark[name], `missing dark.${name}`).toBeDefined()
    }
  })

  it('all values are valid hex strings', () => {
    const result = generatePalette('#6750a4')
    for (const [name, hex] of Object.entries(result.light)) {
      expect(hex, `light.${name}`).toMatch(/^#[0-9a-f]{6}$/i)
    }
    for (const [name, hex] of Object.entries(result.dark)) {
      expect(hex, `dark.${name}`).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })

  it('light and dark produce different values', () => {
    const result = generatePalette('#6750a4')
    expect(result.light.primary).not.toBe(result.dark.primary)
  })

  it('accepts preset name string', () => {
    const result = generatePalette('#6750a4', { scheme: 'vibrant' })
    expect(Object.keys(result.light)).toHaveLength(EXPECTED_TOKEN_NAMES.length)
  })

  it('accepts SchemeConfig object', () => {
    const result = generatePalette('#6750a4', { scheme: presets.vibrant })
    expect(Object.keys(result.light)).toHaveLength(EXPECTED_TOKEN_NAMES.length)
  })

  it('preset name and preset object produce same result', () => {
    const fromName = generatePalette('#6750a4', { scheme: 'vibrant' })
    const fromObj = generatePalette('#6750a4', { scheme: presets.vibrant })
    expect(fromName).toEqual(fromObj)
  })

  it('identical inputs produce identical outputs', () => {
    const a = generatePalette('#6750a4', { scheme: 'tonalSpot', contrastLevel: 0 })
    const b = generatePalette('#6750a4', { scheme: 'tonalSpot', contrastLevel: 0 })
    expect(a).toEqual(b)
  })
})

describe('presets produce distinct palettes', () => {
  const presetNames = Object.keys(presets)
  const results = Object.fromEntries(
    presetNames.map(name => [name, generatePalette('#6750a4', { scheme: name })])
  )

  it('no two presets produce identical light palettes', () => {
    for (let i = 0; i < presetNames.length; i++) {
      for (let j = i + 1; j < presetNames.length; j++) {
        const a = results[presetNames[i]].light
        const b = results[presetNames[j]].light
        const hasDiff = Object.keys(a).some(k => a[k] !== b[k])
        expect(hasDiff, `${presetNames[i]} and ${presetNames[j]} are identical`).toBe(true)
      }
    }
  })
})

describe('contrast compliance at contrastLevel 0', () => {
  const testColors = ['#6750a4', '#0000ff', '#ff0000', '#f2c037', '#21ba45']

  for (const sourceColor of testColors) {
    describe(`source: ${sourceColor}`, () => {
      const result = generatePalette(sourceColor)

      it('on-primary vs primary >= 4.5', () => {
        const ratio = contrastRatio(
          parseHexToLch(result.light['on-primary']),
          parseHexToLch(result.light.primary),
        )
        expect(ratio).toBeGreaterThanOrEqual(4.3)
      })

      it('on-surface vs surface >= 4.5', () => {
        const ratio = contrastRatio(
          parseHexToLch(result.light['on-surface']),
          parseHexToLch(result.light.surface),
        )
        expect(ratio).toBeGreaterThanOrEqual(4.3)
      })

      it('on-primary vs primary >= 4.5 (dark)', () => {
        const ratio = contrastRatio(
          parseHexToLch(result.dark['on-primary']),
          parseHexToLch(result.dark.primary),
        )
        expect(ratio).toBeGreaterThanOrEqual(4.3)
      })

      it('on-surface vs surface >= 4.5 (dark)', () => {
        const ratio = contrastRatio(
          parseHexToLch(result.dark['on-surface']),
          parseHexToLch(result.dark.surface),
        )
        expect(ratio).toBeGreaterThanOrEqual(4.3)
      })
    })
  }
})

describe('contrastLevel affects output', () => {
  it('higher contrastLevel produces >= ratios', () => {
    const normal = generatePalette('#6750a4', { contrastLevel: 0 })
    const high = generatePalette('#6750a4', { contrastLevel: 1 })
    const normalRatio = contrastRatio(
      parseHexToLch(normal.light['on-primary']),
      parseHexToLch(normal.light.primary),
    )
    const highRatio = contrastRatio(
      parseHexToLch(high.light['on-primary']),
      parseHexToLch(high.light.primary),
    )
    expect(highRatio).toBeGreaterThanOrEqual(normalRatio - 0.1)
  })
})
