import { describe, it, expect } from 'vitest'
import { TOKEN_DEFS, EXPECTED_TOKEN_NAMES } from '../src/tokens.js'

describe('TOKEN_DEFS', () => {
  it('contains exactly 53 token definitions', () => {
    expect(TOKEN_DEFS).toHaveLength(53)
  })

  it('each has required fields', () => {
    for (const def of TOKEN_DEFS) {
      expect(def.name).toBeTruthy()
      expect(def.palette).toBeTruthy()
      expect(def.lightTone).toBeGreaterThanOrEqual(0)
      expect(def.lightTone).toBeLessThanOrEqual(1)
      expect(def.darkTone).toBeGreaterThanOrEqual(0)
      expect(def.darkTone).toBeLessThanOrEqual(1)
    }
  })

  it('has no duplicate names', () => {
    const names = TOKEN_DEFS.map(d => d.name)
    expect(new Set(names).size).toBe(names.length)
  })

  it('all background references point to existing tokens', () => {
    const names = new Set(TOKEN_DEFS.map(d => d.name))
    for (const def of TOKEN_DEFS) {
      if (def.background) {
        expect(names.has(def.background), `${def.name} background '${def.background}' not found`).toBe(true)
      }
    }
  })

  it('every token with a contrastTarget also has a background', () => {
    for (const def of TOKEN_DEFS) {
      if (def.contrastTarget) {
        expect(def.background, `${def.name} has contrastTarget but no background`).toBeTruthy()
      }
    }
  })

  it('contrast targets have all four levels in ascending order', () => {
    for (const def of TOKEN_DEFS) {
      if (def.contrastTarget) {
        const ct = def.contrastTarget
        expect(ct.reduced).toBeGreaterThanOrEqual(1)
        expect(ct.standard).toBeGreaterThanOrEqual(ct.reduced)
        expect(ct.medium).toBeGreaterThanOrEqual(ct.standard)
        expect(ct.high).toBeGreaterThanOrEqual(ct.medium)
      }
    }
  })

  it('EXPECTED_TOKEN_NAMES matches TOKEN_DEFS names', () => {
    const names = TOKEN_DEFS.map(d => d.name)
    expect(EXPECTED_TOKEN_NAMES).toEqual(names)
  })
})
