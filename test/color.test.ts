import { describe, it, expect } from 'vitest'
import {
  parseHex,
  parseHexToLch,
  formatHex,
  formatLchHex,
  hslToLch,
  lchToHsl,
  contrastRatio,
  findLightnessForContrast,
  harmonizeHsl,
  referenceChroma,
} from '../src/color.js'
import type { OkHSL, OkLCH } from '../src/color.js'

describe('parseHex', () => {
  it('parses white to OkHSL', () => {
    const hsl = parseHex('#ffffff')
    expect(hsl.l).toBeCloseTo(1.0, 2)
    expect(hsl.s).toBeCloseTo(0.0, 2)
  })

  it('parses black to OkHSL', () => {
    const hsl = parseHex('#000000')
    expect(hsl.l).toBeCloseTo(0.0, 2)
  })

  it('accepts hex without #', () => {
    const hsl = parseHex('ff0000')
    expect(hsl.h).toBeGreaterThan(0)
    expect(hsl.s).toBeGreaterThan(0.5)
  })
})

describe('parseHexToLch', () => {
  it('parses white to OkLCH', () => {
    const lch = parseHexToLch('#ffffff')
    expect(lch.l).toBeCloseTo(1.0, 2)
    expect(lch.c).toBeCloseTo(0.0, 1)
  })

  it('parses a saturated blue', () => {
    const lch = parseHexToLch('#0000ff')
    expect(lch.l).toBeGreaterThan(0.3)
    expect(lch.l).toBeLessThan(0.5)
    expect(lch.c).toBeGreaterThan(0.1)
    expect(lch.h).toBeGreaterThan(240)
    expect(lch.h).toBeLessThan(280)
  })
})

describe('formatHex', () => {
  it('formats OkHSL to valid hex', () => {
    const hex = formatHex({ h: 0, s: 0, l: 1 })
    expect(hex).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it('round-trips through OkHSL within 1 unit per channel', () => {
    const inputs = ['#ff0000', '#00ff00', '#0000ff', '#6750a4', '#f2c037', '#757575']
    for (const input of inputs) {
      const hsl = parseHex(input)
      const output = formatHex(hsl).toLowerCase()
      const inputLower = input.toLowerCase()
      for (let i = 1; i < 7; i += 2) {
        const orig = parseInt(inputLower.slice(i, i + 2), 16)
        const result = parseInt(output.slice(i, i + 2), 16)
        expect(Math.abs(orig - result)).toBeLessThanOrEqual(1)
      }
    }
  })
})

describe('formatLchHex', () => {
  it('formats OkLCH to valid hex', () => {
    const hex = formatLchHex({ l: 0.5, c: 0.15, h: 270 })
    expect(hex).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it('round-trips through OkLCH within 1 unit per channel', () => {
    const inputs = ['#ff0000', '#00ff00', '#0000ff', '#6750a4', '#f2c037']
    for (const input of inputs) {
      const lch = parseHexToLch(input)
      const output = formatLchHex(lch).toLowerCase()
      const inputLower = input.toLowerCase()
      for (let i = 1; i < 7; i += 2) {
        const orig = parseInt(inputLower.slice(i, i + 2), 16)
        const result = parseInt(output.slice(i, i + 2), 16)
        expect(Math.abs(orig - result)).toBeLessThanOrEqual(1)
      }
    }
  })
})

describe('hslToLch / lchToHsl', () => {
  it('round-trips OkHSL -> OkLCH -> OkHSL', () => {
    const original: OkHSL = { h: 270, s: 0.8, l: 0.5 }
    const lch = hslToLch(original)
    const back = lchToHsl(lch)
    expect(back.h).toBeCloseTo(original.h, 1)
    expect(back.s).toBeCloseTo(original.s, 2)
    expect(back.l).toBeCloseTo(original.l, 2)
  })

  it('preserves hue and lightness direction', () => {
    const hsl: OkHSL = { h: 120, s: 0.6, l: 0.7 }
    const lch = hslToLch(hsl)
    expect(lch.h).toBeCloseTo(hsl.h, 0)
    expect(lch.l).toBeCloseTo(hsl.l, 1)
    expect(lch.c).toBeGreaterThan(0)
  })
})

describe('contrastRatio', () => {
  it('white on black = 21', () => {
    const white: OkLCH = { l: 1, c: 0, h: 0 }
    const black: OkLCH = { l: 0, c: 0, h: 0 }
    expect(contrastRatio(white, black)).toBeCloseTo(21, 0)
  })

  it('same color on itself = 1', () => {
    const color: OkLCH = { l: 0.5, c: 0.1, h: 270 }
    expect(contrastRatio(color, color)).toBeCloseTo(1, 1)
  })

  it('#757575 on white ~ 4.6', () => {
    const gray = parseHexToLch('#757575')
    const white: OkLCH = { l: 1, c: 0, h: 0 }
    const ratio = contrastRatio(gray, white)
    expect(ratio).toBeGreaterThan(4.4)
    expect(ratio).toBeLessThan(4.8)
  })

  it('is symmetric', () => {
    const a = parseHexToLch('#336699')
    const b = parseHexToLch('#ffffff')
    expect(contrastRatio(a, b)).toBeCloseTo(contrastRatio(b, a), 5)
  })
})

describe('findLightnessForContrast', () => {
  it('finds lighter foreground achieving 4.5:1 on dark bg', () => {
    const bg: OkLCH = { l: 0.06, c: 0, h: 0 }
    const l = findLightnessForContrast(0, 0, bg, 4.5, true)
    expect(l).toBeGreaterThan(0.3)
    expect(l).toBeLessThan(1.0)
    // l is OkHSL lightness — must convert to OkLCH to verify contrast
    const fg = hslToLch({ h: 0, s: 0, l })
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(4.5 - 0.1)
  })

  it('finds darker foreground achieving 4.5:1 on light bg', () => {
    const bg: OkLCH = { l: 0.98, c: 0, h: 0 }
    const l = findLightnessForContrast(0, 0, bg, 4.5, false)
    expect(l).toBeGreaterThan(0.0)
    expect(l).toBeLessThan(0.6)
    const fg = hslToLch({ h: 0, s: 0, l })
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(4.5 - 0.1)
  })

  it('finds lightness for 7:1 contrast', () => {
    const bg: OkLCH = { l: 0.98, c: 0.02, h: 270 }
    const l = findLightnessForContrast(270, 0.5, bg, 7.0, false)
    const fg = hslToLch({ h: 270, s: 0.5, l })
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(7.0 - 0.2)
  })
})

describe('harmonizeHsl', () => {
  it('shifts design hue toward source', () => {
    const design: OkHSL = { h: 120, s: 0.8, l: 0.5 }
    const source: OkHSL = { h: 270, s: 0.8, l: 0.5 }
    const result = harmonizeHsl(design, source)
    const originalDiff = Math.abs(120 - 270)
    const resultDiff = Math.min(
      Math.abs(result.h - 270),
      360 - Math.abs(result.h - 270),
    )
    expect(resultDiff).toBeLessThan(originalDiff)
  })

  it('limits shift to maxShift degrees', () => {
    const design: OkHSL = { h: 120, s: 0.8, l: 0.5 }
    const source: OkHSL = { h: 270, s: 0.8, l: 0.5 }
    const result = harmonizeHsl(design, source, 10)
    const shift = Math.min(
      Math.abs(result.h - 120),
      360 - Math.abs(result.h - 120),
    )
    expect(shift).toBeLessThanOrEqual(10 + 0.01)
  })

  it('preserves saturation and lightness', () => {
    const design: OkHSL = { h: 120, s: 0.7, l: 0.6 }
    const source: OkHSL = { h: 270, s: 0.8, l: 0.5 }
    const result = harmonizeHsl(design, source)
    expect(result.s).toBeCloseTo(design.s, 5)
    expect(result.l).toBeCloseTo(design.l, 5)
  })

  it('does not shift when hues are already close', () => {
    const design: OkHSL = { h: 120, s: 0.8, l: 0.5 }
    const source: OkHSL = { h: 125, s: 0.8, l: 0.5 }
    const result = harmonizeHsl(design, source)
    const shift = Math.abs(result.h - design.h)
    expect(shift).toBeLessThan(3)
  })
})

describe('referenceChroma', () => {
  it('higher saturation -> higher chroma', () => {
    const low = referenceChroma(270, 0.2)
    const high = referenceChroma(270, 0.8)
    expect(high).toBeGreaterThan(low)
  })

  it('zero saturation -> near-zero chroma', () => {
    expect(referenceChroma(270, 0)).toBeCloseTo(0, 2)
  })

  it('returns positive for nonzero saturation', () => {
    expect(referenceChroma(120, 0.5)).toBeGreaterThan(0)
    expect(referenceChroma(30, 0.9)).toBeGreaterThan(0)
    expect(referenceChroma(265, 1.0)).toBeGreaterThan(0)
  })
})
