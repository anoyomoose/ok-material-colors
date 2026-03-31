export type PaletteRole =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'neutral'
  | 'neutralVariant'
  | 'error'

export interface ContrastTarget {
  reduced: number   // contrastLevel -1
  standard: number  // contrastLevel 0
  medium: number    // contrastLevel 0.5
  high: number      // contrastLevel 1
}

export interface TokenDef {
  name: string
  palette: PaletteRole
  lightTone: number   // L* / 100 (CIE lightness, converted to OkL at resolution time)
  darkTone: number    // L* / 100
  background?: string
  contrastTarget?: ContrastTarget
}

// Contrast curves matching Google's 2025 phone spec for TONAL_SPOT.
// getCurve(X) at contrastLevel=0 requires X:1 ratio.
const CT_6: ContrastTarget = { reduced: 3, standard: 6, medium: 7, high: 11 }     // on-primary, on-secondary, etc.
const CT_7: ContrastTarget = { reduced: 4.5, standard: 7, medium: 11, high: 21 }  // inverse-on-surface, on-*-fixed
const CT_9: ContrastTarget = { reduced: 4.5, standard: 9, medium: 11, high: 21 }  // on-surface
const CT_4_5: ContrastTarget = { reduced: 3, standard: 4.5, medium: 7, high: 7 }  // on-surface-variant, on-error-container, on-*-fixed-variant
const CT_3: ContrastTarget = { reduced: 1.5, standard: 3, medium: 4.5, high: 7 }  // outline
const CT_1_5: ContrastTarget = { reduced: 1, standard: 1.5, medium: 3, high: 4.5 } // outline-variant, containers vs surface

// All tone values are L*/100 from Google's 2025 phone spec for TONAL_SPOT.
// Dynamic tones (tMaxC/tMinC) are approximated with static values.

function brandTokens(prefix: string, palette: PaletteRole): TokenDef[] {
  // 2025 phone: primary/secondary/tertiary light ≈ tMaxC (~40), dark = 80
  // Container light ≈ 90, dark = 25-30
  return [
    { name: prefix, palette, lightTone: 0.40, darkTone: 0.80, background: 'surface', contrastTarget: CT_4_5 },
    { name: `${prefix}-dim`, palette, lightTone: 0.35, darkTone: 0.75, background: 'surface', contrastTarget: CT_4_5 },
    { name: `on-${prefix}`, palette, lightTone: 1.00, darkTone: 0.20, background: prefix, contrastTarget: CT_6 },
    { name: `${prefix}-container`, palette, lightTone: 0.90, darkTone: 0.25, background: 'surface', contrastTarget: CT_1_5 },
    { name: `on-${prefix}-container`, palette, lightTone: 0.10, darkTone: 0.90, background: `${prefix}-container`, contrastTarget: CT_6 },
  ]
}

function fixedTokens(prefix: string, palette: PaletteRole): TokenDef[] {
  // 2025: fixed = container(isDark=false), fixedDim = fixed - 5
  return [
    { name: `${prefix}-fixed`, palette, lightTone: 0.90, darkTone: 0.90 },
    { name: `${prefix}-fixed-dim`, palette, lightTone: 0.85, darkTone: 0.85 },
    { name: `on-${prefix}-fixed`, palette, lightTone: 0.10, darkTone: 0.10, background: `${prefix}-fixed-dim`, contrastTarget: CT_7 },
    { name: `on-${prefix}-fixed-variant`, palette, lightTone: 0.30, darkTone: 0.30, background: `${prefix}-fixed-dim`, contrastTarget: CT_4_5 },
  ]
}

export const TOKEN_DEFS: TokenDef[] = [
  // Primary (10): brand + fixed + inverse
  ...brandTokens('primary', 'primary'),
  ...fixedTokens('primary', 'primary'),
  { name: 'inverse-primary', palette: 'primary', lightTone: 0.40, darkTone: 0.40, background: 'inverse-surface', contrastTarget: CT_6 },

  // Secondary (9): brand + fixed
  ...brandTokens('secondary', 'secondary'),
  ...fixedTokens('secondary', 'secondary'),

  // Tertiary (9): brand + fixed
  ...brandTokens('tertiary', 'tertiary'),
  ...fixedTokens('tertiary', 'tertiary'),

  // Error (5): brand only
  { name: 'error', palette: 'error', lightTone: 0.40, darkTone: 0.80, background: 'surface', contrastTarget: CT_4_5 },
  { name: 'error-dim', palette: 'error', lightTone: 0.35, darkTone: 0.75, background: 'surface', contrastTarget: CT_4_5 },
  { name: 'on-error', palette: 'error', lightTone: 1.00, darkTone: 0.20, background: 'error', contrastTarget: CT_6 },
  { name: 'error-container', palette: 'error', lightTone: 0.90, darkTone: 0.30, background: 'surface', contrastTarget: CT_1_5 },
  { name: 'on-error-container', palette: 'error', lightTone: 0.10, darkTone: 0.90, background: 'error-container', contrastTarget: CT_4_5 },

  // Background (2)
  { name: 'background', palette: 'neutral', lightTone: 0.98, darkTone: 0.06 },
  { name: 'on-background', palette: 'neutral', lightTone: 0.10, darkTone: 0.90, background: 'background', contrastTarget: CT_9 },

  // Surface (12) — using 2021 base tones (L*) which most variants fall back to.
  // 2025 phone overrides (TONAL_SPOT only) are slightly darker; the difference
  // is 1-2 L* units and not visually significant. Using 2021 values ensures
  // consistent behavior across all scheme variants.
  { name: 'surface', palette: 'neutral', lightTone: 0.98, darkTone: 0.06 },
  { name: 'on-surface', palette: 'neutral', lightTone: 0.10, darkTone: 0.90, background: 'surface', contrastTarget: CT_9 },
  { name: 'surface-variant', palette: 'neutralVariant', lightTone: 0.90, darkTone: 0.30 },
  { name: 'on-surface-variant', palette: 'neutralVariant', lightTone: 0.30, darkTone: 0.80, background: 'surface', contrastTarget: CT_4_5 },
  { name: 'surface-dim', palette: 'neutral', lightTone: 0.87, darkTone: 0.06 },
  { name: 'surface-bright', palette: 'neutral', lightTone: 0.98, darkTone: 0.24 },
  { name: 'surface-container-lowest', palette: 'neutral', lightTone: 1.00, darkTone: 0.04 },
  { name: 'surface-container-low', palette: 'neutral', lightTone: 0.96, darkTone: 0.10 },
  { name: 'surface-container', palette: 'neutral', lightTone: 0.94, darkTone: 0.12 },
  { name: 'surface-container-high', palette: 'neutral', lightTone: 0.92, darkTone: 0.17 },
  { name: 'surface-container-highest', palette: 'neutral', lightTone: 0.90, darkTone: 0.22 },
  { name: 'surface-tint', palette: 'primary', lightTone: 0.40, darkTone: 0.80 },

  // Outline (2)
  { name: 'outline', palette: 'neutralVariant', lightTone: 0.50, darkTone: 0.60, background: 'surface', contrastTarget: CT_3 },
  { name: 'outline-variant', palette: 'neutralVariant', lightTone: 0.80, darkTone: 0.30, background: 'surface', contrastTarget: CT_1_5 },

  // Inverse (2) — inverse-surface uses the opposite mode's surface tone
  { name: 'inverse-surface', palette: 'neutral', lightTone: 0.20, darkTone: 0.90 },
  { name: 'inverse-on-surface', palette: 'neutral', lightTone: 0.95, darkTone: 0.20, background: 'inverse-surface', contrastTarget: CT_7 },

  // Utility (2)
  { name: 'shadow', palette: 'neutral', lightTone: 0.00, darkTone: 0.00 },
  { name: 'scrim', palette: 'neutral', lightTone: 0.00, darkTone: 0.00 },
]

/** Ordered list of all expected token names, for validation. */
export const EXPECTED_TOKEN_NAMES = TOKEN_DEFS.map(d => d.name)
