import { describe, it, expect } from 'vitest'
import { createTonalPalette, createTonalPaletteFromChroma } from '../src/tonal-palette.js'

describe('createTonalPalette', () => {
  it('produces valid hex at all lightness steps', () => {
    const palette = createTonalPalette(270, 0.8)
    for (let l = 0; l <= 1; l += 0.05) {
      const hex = palette.hexAt(l)
      expect(hex).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })

  it('lightness 0 is near-black', () => {
    // With zero chroma, gamut mapping doesn't shift lightness
    const palette = createTonalPalette(270, 0)
    expect(palette.at(0).l).toBeCloseTo(0, 1)
    // With high chroma, gamut mapping may shift L slightly to stay in gamut
    const chromatic = createTonalPalette(270, 0.8)
    expect(chromatic.at(0).l).toBeLessThan(0.25)
  })

  it('lightness 1 is near-white', () => {
    const palette = createTonalPalette(270, 0)
    expect(palette.at(1).l).toBeCloseTo(1, 1)
    // With high chroma, gamut mapping reduces L to stay in gamut
    const chromatic = createTonalPalette(270, 0.8)
    expect(chromatic.at(1).l).toBeGreaterThan(0.75)
  })

  it('chroma is roughly constant in mid-range', () => {
    const palette = createTonalPalette(270, 0.8)
    const chromas: number[] = []
    for (let l = 0.25; l <= 0.75; l += 0.05) {
      chromas.push(palette.at(l).c)
    }
    const avg = chromas.reduce((a, b) => a + b) / chromas.length
    for (const c of chromas) {
      expect(c).toBeGreaterThan(avg * 0.7)
    }
  })

  it('zero saturation produces achromatic ramp', () => {
    const palette = createTonalPalette(270, 0)
    for (let l = 0.1; l <= 0.9; l += 0.1) {
      expect(palette.at(l).c).toBeLessThan(0.005)
    }
  })

  it('higher saturation -> higher chroma at L=0.5', () => {
    const low = createTonalPalette(270, 0.3)
    const high = createTonalPalette(270, 0.9)
    expect(high.at(0.5).c).toBeGreaterThan(low.at(0.5).c)
  })

  it('stores hue and chroma', () => {
    const palette = createTonalPalette(120, 0.6)
    expect(palette.hue).toBeCloseTo(120, 0)
    expect(palette.chroma).toBeGreaterThan(0)
  })
})

describe('createTonalPaletteFromChroma', () => {
  it('uses the provided chroma directly', () => {
    const palette = createTonalPaletteFromChroma(270, 0.12)
    expect(palette.chroma).toBeCloseTo(0.12, 3)
  })

  it('produces valid hex at all steps', () => {
    const palette = createTonalPaletteFromChroma(120, 0.15)
    for (let l = 0; l <= 1; l += 0.1) {
      expect(palette.hexAt(l)).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })
})

describe('edge hues', () => {
  const edgeHues = [
    { name: 'red', hue: 30 },
    { name: 'yellow', hue: 110 },
    { name: 'blue', hue: 265 },
  ]

  for (const { name, hue } of edgeHues) {
    it(`${name} (hue=${hue}) produces valid ramp`, () => {
      const palette = createTonalPalette(hue, 0.9)
      for (let l = 0; l <= 1; l += 0.05) {
        const hex = palette.hexAt(l)
        expect(hex).toMatch(/^#[0-9a-f]{6}$/i)
      }
    })
  }
})
