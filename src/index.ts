// Core functions
export { generatePalette } from './scheme.js'
export type { PaletteTokens, PaletteOptions } from './scheme.js'

// Harmonize (public hex-boundary wrapper)
export { harmonize } from './harmonize.js'

// Types
export type { SchemeConfig, RelativeSaturation } from './presets.js'

// Presets — individual + map
export {
  presets,
  tonalSpot,
  vibrant,
  expressive,
  neutral,
  fidelity,
  content,
  monochrome,
  rainbow,
  fruitSalad,
  cmf,
} from './presets.js'

// Token definitions (for consumers that need to enumerate tokens)
export { EXPECTED_TOKEN_NAMES } from './tokens.js'
export type { TokenDef, PaletteRole, ContrastTarget } from './tokens.js'
