import { describe, it } from 'vitest'
import { generatePalette } from '../src/scheme.js'

import {
  argbFromHex, hexFromArgb, Hct, MaterialDynamicColors,
  SchemeTonalSpot, SchemeFruitSalad,
} from '../../q2-fresh-paint-md3e/vendor/material-color-utilities/typescript/index.js'

function googlePalette(hex: string, SchemeClass: any) {
  const source = Hct.fromInt(argbFromHex(hex))
  const light = new SchemeClass(source, false, 0, '2026')
  const dark = new SchemeClass(source, true, 0, '2026')
  return { light, dark }
}

function printComparison(
  label: string,
  gLight: any, gDark: any,
  ok: { light: Record<string, string>; dark: Record<string, string> },
  tokens: [string, string][],
) {
  const c = new MaterialDynamicColors()
  console.log(`\n${label}:`)
  console.log('Token'.padEnd(28) + '  Google Dark  OkLab Dark  | Google Light OkLab Light')
  console.log('-'.repeat(85))
  for (const [gMethod, okToken] of tokens) {
    const dc = (c as any)[gMethod]?.()
    if (!dc) continue
    const gd = hexFromArgb(dc.getArgb(gDark))
    const gl = hexFromArgb(dc.getArgb(gLight))
    const od = ok.dark[okToken] || '-------'
    const ol = ok.light[okToken] || '-------'
    console.log(okToken.padEnd(28) + '  ' + gd + '  ' + od + '  | ' + gl + '  ' + ol)
  }
}

const ALL_TOKENS: [string, string][] = [
  ['surface', 'surface'],
  ['surfaceDim', 'surface-dim'],
  ['surfaceBright', 'surface-bright'],
  ['surfaceContainerLowest', 'surface-container-lowest'],
  ['surfaceContainerLow', 'surface-container-low'],
  ['surfaceContainer', 'surface-container'],
  ['surfaceContainerHigh', 'surface-container-high'],
  ['surfaceContainerHighest', 'surface-container-highest'],
  ['primary', 'primary'],
  ['primaryDim', 'primary-dim'],
  ['onPrimary', 'on-primary'],
  ['primaryContainer', 'primary-container'],
  ['onPrimaryContainer', 'on-primary-container'],
  ['secondary', 'secondary'],
  ['onSecondary', 'on-secondary'],
  ['secondaryContainer', 'secondary-container'],
  ['tertiary', 'tertiary'],
  ['onTertiary', 'on-tertiary'],
  ['tertiaryContainer', 'tertiary-container'],
  ['error', 'error'],
  ['onError', 'on-error'],
  ['onSurface', 'on-surface'],
  ['onSurfaceVariant', 'on-surface-variant'],
  ['surfaceVariant', 'surface-variant'],
  ['outline', 'outline'],
  ['outlineVariant', 'outline-variant'],
  ['background', 'background'],
  ['onBackground', 'on-background'],
  ['inverseSurface', 'inverse-surface'],
  ['inverseOnSurface', 'inverse-on-surface'],
  ['inversePrimary', 'inverse-primary'],
  ['surfaceTint', 'surface-tint'],
]

describe('Google vs OkLab comparison for #6750a4 tonalSpot', () => {
  it('prints side-by-side comparison', () => {
    const { light: gLight, dark: gDark } = googlePalette('#6750a4', SchemeTonalSpot)
    const c = new MaterialDynamicColors()

    // OkLab
    const ok = generatePalette('#6750a4', { scheme: 'tonalSpot' })

    const methods: [string, string][] = [
      ['surface', 'surface'],
      ['surfaceDim', 'surface-dim'],
      ['surfaceBright', 'surface-bright'],
      ['surfaceContainerLowest', 'surface-container-lowest'],
      ['surfaceContainerLow', 'surface-container-low'],
      ['surfaceContainer', 'surface-container'],
      ['surfaceContainerHigh', 'surface-container-high'],
      ['surfaceContainerHighest', 'surface-container-highest'],
      ['primary', 'primary'],
      ['primaryDim', 'primary-dim'],
      ['onPrimary', 'on-primary'],
      ['primaryContainer', 'primary-container'],
      ['onPrimaryContainer', 'on-primary-container'],
      ['secondary', 'secondary'],
      ['onSecondary', 'on-secondary'],
      ['secondaryContainer', 'secondary-container'],
      ['tertiary', 'tertiary'],
      ['onTertiary', 'on-tertiary'],
      ['tertiaryContainer', 'tertiary-container'],
      ['error', 'error'],
      ['onError', 'on-error'],
      ['onSurface', 'on-surface'],
      ['onSurfaceVariant', 'on-surface-variant'],
      ['surfaceVariant', 'surface-variant'],
      ['outline', 'outline'],
      ['outlineVariant', 'outline-variant'],
      ['background', 'background'],
      ['onBackground', 'on-background'],
      ['inverseSurface', 'inverse-surface'],
      ['inverseOnSurface', 'inverse-on-surface'],
      ['inversePrimary', 'inverse-primary'],
      ['surfaceTint', 'surface-tint'],
    ]

    console.log('\n' + 'Token'.padEnd(28) + '  Google Dark  OkLab Dark  | Google Light OkLab Light')
    console.log('-'.repeat(85))
    for (const [gMethod, okToken] of methods) {
      const dc = (c as any)[gMethod]?.()
      if (!dc) continue
      const gd = hexFromArgb(dc.getArgb(gDark))
      const gl = hexFromArgb(dc.getArgb(gLight))
      const od = ok.dark[okToken] || '-------'
      const ol = ok.light[okToken] || '-------'
      console.log(
        okToken.padEnd(28) +
        '  ' + gd + '  ' + od +
        '  | ' + gl + '  ' + ol
      )
    }
  })
})

describe('Google vs OkLab comparison for #6750a4 fruitSalad', () => {
  it('prints side-by-side comparison', () => {
    const { light: gLight, dark: gDark } = googlePalette('#6750a4', SchemeFruitSalad)
    const ok = generatePalette('#6750a4', { scheme: 'fruitSalad' })
    printComparison('fruitSalad #6750a4', gLight, gDark, ok, ALL_TOKENS)
  })
})
