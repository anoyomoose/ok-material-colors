# ok-material-colors

OkLCH/OkHSL-based Material Design 3 palette generator. Produces the same 53 standard MD3 color tokens as Google's `material-color-utilities`, but built on Björn Ottosson's perceptually uniform color spaces instead of CAM16/HCT.

Built for use in [@anoyomoose/q2-fresh-paint-md3e](https://github.com/AnoYoMoose/q2-fresh-paint-md3e). This is primarily an internal package, but it's MIT-licensed — have at it.

Just wanted to see if using OkLAB based toning would look nicer, while using the same basic idea as Google's algorithm. Sometimes it does!

## Install

```bash
pnpm install @anoyomoose/ok-material-colors
```

## Usage

```typescript
import { generatePalette, harmonize, vibrant } from 'ok-material-colors'

// Generate a full light + dark palette from a source color
const palette = generatePalette('#6750a4')
// palette.light['primary']    → '#615588'
// palette.dark['on-surface']  → '#e3e1ea'

// Pick a preset
const vib = generatePalette('#ff0000', { scheme: 'vibrant' })

// Tweak a preset
const custom = generatePalette('#ff0000', {
  scheme: { ...vibrant, neutralSaturation: 0.08 },
})

// Adjust contrast (-1 to 1)
const highContrast = generatePalette('#6750a4', { contrastLevel: 1 })

// Harmonize a custom color toward the theme source
const harmonized = harmonize('#21BA45', '#6750a4')
// Shifts green's hue toward purple by up to 15°
```

## API

### `generatePalette(hex, options?)`

Returns `{ light: Record<string, string>, dark: Record<string, string> }` — 53 MD3 tokens per mode as sRGB hex values.

**Options:**

| Option | Type | Default | Description |
|---|---|---|---|
| `scheme` | `string \| SchemeConfig` | `'tonalSpot'` | Preset name or custom config |
| `contrastLevel` | `number` | `0` | `-1` (reduced) to `1` (high) |
| `secondarySourceColor` | `string` | — | Second source color for `cmf` preset |

### `harmonize(designColorHex, sourceColorHex)`

Shifts the design color's hue toward the source by up to 15°, preserving saturation and lightness. Returns sRGB hex.

### Presets

`tonalSpot`, `vibrant`, `expressive`, `neutral`, `fidelity`, `content`, `monochrome`, `rainbow`, `fruitSalad`, `cmf`

All exported individually and as `presets` (a `Record<string, SchemeConfig>`).

### SchemeConfig

Every preset is a plain `SchemeConfig` object you can spread and override:

```typescript
interface SchemeConfig {
  name: string
  primaryHueOffset: number          // -180 to 180
  primarySaturation: number | 'source'  // 0 to 1
  secondaryHueOffset: number
  secondarySaturation: number | 'source' | RelativeSaturation
  tertiaryHueOffset: number | 'complement' | 'analogous'
  tertiarySaturation: number | 'source' | RelativeSaturation
  neutralHueOffset: number
  neutralSaturation: number | RelativeSaturation
  neutralVariantHueOffset: number
  neutralVariantSaturation: number | RelativeSaturation
  errorHue: number                  // 0 to 360 (absolute)
  errorSaturation: number | RelativeSaturation
  darkSurfaceScale?: number         // 0.75 to 1.25, scales dark surface OkL. Default: 1.0
  darkLowestIsBlack?: boolean       // surface-container-lowest dark = pure black
}

interface RelativeSaturation {
  factor: number   // multiplied by source saturation
  offset?: number  // added after
  min?: number     // floor
}
```

## How it works

1. Source hex is parsed to OkHSL once
2. Six tonal palettes are derived (primary, secondary, tertiary, neutral, neutralVariant, error) based on the scheme config's hue offsets and saturations
3. Tonal ramps are generated in OkLCH with constant chroma and gamut clamping
4. Token lightness values are converted from CIE L\* to OkLab L for correct perceptual mapping
5. Contrast targets are enforced via binary search on real WCAG 2.1 ratios
6. sRGB hex conversion happens only at the final output boundary

Uses [@texel/color](https://github.com/texel-org/color) for color space conversions and gamut mapping.

## License

MIT
