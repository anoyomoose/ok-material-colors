export interface RelativeSaturation {
  factor: number
  offset?: number
  min?: number
}

export interface SchemeConfig {
  name: string

  primaryHueOffset: number
  primarySaturation: number | 'source'

  secondaryHueOffset: number
  secondarySaturation: number | 'source' | RelativeSaturation

  tertiaryHueOffset: number | 'complement' | 'analogous'
  tertiarySaturation: number | 'source' | RelativeSaturation

  neutralHueOffset: number
  neutralSaturation: number | RelativeSaturation

  neutralVariantHueOffset: number
  neutralVariantSaturation: number | RelativeSaturation

  errorHue: number
  errorSaturation: number | RelativeSaturation
}

// Saturation values calibrated from Google's CAM16 chroma values.
// Mapping: CAM16 chroma → OkLCH chroma (÷400) → OkHSL saturation at ref L=0.5.
// This is hue-dependent; values calibrated for purple (~290°) as reference.
// Key calibration points (at hue 290):
//   CAM16  5 → OkHSL 0.065    CAM16 16 → 0.20     CAM16 32 → 0.375
//   CAM16 48 → 0.53           CAM16 74 → 0.76     CAM16 84 → 0.84

export const tonalSpot: SchemeConfig = {
  name: 'tonalSpot',
  primaryHueOffset: 0,
  primarySaturation: 0.375,             // Google: CAM16 chroma 32
  secondaryHueOffset: 0,
  secondarySaturation: 0.20,            // Google: chroma 16
  /* SIMPLIFIED: Google uses piecewise table [0,20,71,161,333,360] -> [-40,48,-32,40,-32] */
  tertiaryHueOffset: 60,
  tertiarySaturation: 0.33,             // Google: chroma 28
  neutralHueOffset: 0,
  neutralSaturation: 0.065,             // Google: chroma 5
  neutralVariantHueOffset: 0,
  neutralVariantSaturation: 0.11,       // Google: chroma 5 * 1.7 ~ 8.5
  errorHue: 25,                         // Google: piecewise [0,3,13,...] -> [12,22,32,...]
  errorSaturation: 0.64,                // Google: chroma 60
}

export const vibrant: SchemeConfig = {
  name: 'vibrant',
  primaryHueOffset: 0,
  primarySaturation: 0.76,              // Google: chroma 74
  /* SIMPLIFIED: Google uses piecewise table [0,38,105,140,333,360] -> [-14,10,-14,10,-14] */
  secondaryHueOffset: 0,
  secondarySaturation: 0.61,            // Google: chroma 56
  /* SIMPLIFIED: Google uses piecewise table [0,38,71,105,140,161,253,333,360] -> [-72,35,24,-24,62,50,62,-72] */
  tertiaryHueOffset: 50,
  tertiarySaturation: 0.61,             // Google: chroma 56
  /* SIMPLIFIED: Google uses piecewise table [0,38,105,140,333,360] -> [-14,10,-14,10,-14] */
  neutralHueOffset: 0,
  neutralSaturation: 0.33,              // Google: chroma 28
  neutralVariantHueOffset: 0,
  neutralVariantSaturation: 0.42,       // Google: chroma 28 * 1.29 ~ 36
  errorHue: 25,
  errorSaturation: 0.81,                // Google: chroma 80
}

export const expressive: SchemeConfig = {
  name: 'expressive',
  primaryHueOffset: 0,
  primarySaturation: 0.53,              // Google: chroma 48 (light), 36 (dark)
  /* SIMPLIFIED: Google uses piecewise table [0,105,140,204,253,278,300,333,360] -> [-160,155,-100,96,-96,-156,-165,-160] */
  secondaryHueOffset: 150,
  secondarySaturation: 0.29,            // Google: chroma 24
  /* SIMPLIFIED: Google uses piecewise table [0,105,140,204,253,278,300,333,360] -> [-165,160,-105,101,-101,-160,-170,-165] */
  tertiaryHueOffset: -120,
  tertiarySaturation: 0.53,             // Google: chroma 48
  /* SIMPLIFIED: Google uses piecewise table [0,71,124,253,278,300,360] -> [10,0,10,0,10,0] */
  neutralHueOffset: 8,
  neutralSaturation: 0.22,              // Google: chroma 18 (light), 14 (dark)
  neutralVariantHueOffset: 8,
  neutralVariantSaturation: 0.46,       // Google: chroma ~41 (18 * 2.3)
  errorHue: 25,
  errorSaturation: 0.68,                // Google: chroma 64
}

export const neutral: SchemeConfig = {
  name: 'neutral',
  primaryHueOffset: 0,
  primarySaturation: 0.15,              // Google: chroma 8-12
  secondaryHueOffset: 0,
  secondarySaturation: 0.065,           // Google: chroma 4-6
  /* SIMPLIFIED: Google uses piecewise table [0,38,105,161,204,278,333,360] -> [-32,26,10,-39,24,-15,-32] */
  tertiaryHueOffset: 30,
  tertiarySaturation: 0.25,             // Google: chroma 20
  neutralHueOffset: 0,
  neutralSaturation: 0.018,             // Google: chroma 1.4
  neutralVariantHueOffset: 0,
  neutralVariantSaturation: 0.040,      // Google: chroma 1.4 * 2.2 ~ 3
  errorHue: 25,
  errorSaturation: 0.55,                // Google: chroma 50
}

export const fidelity: SchemeConfig = {
  name: 'fidelity',
  primaryHueOffset: 0,
  primarySaturation: 'source',
  secondaryHueOffset: 0,
  secondarySaturation: { factor: 0.5, offset: -0.15 },
  tertiaryHueOffset: 'complement',
  tertiarySaturation: 0.29,             // Google: chroma 24
  neutralHueOffset: 0,
  neutralSaturation: { factor: 0.125 },
  neutralVariantHueOffset: 0,
  neutralVariantSaturation: { factor: 0.125, offset: 0.04 },
  errorHue: 25,
  errorSaturation: 0.84,                // Google: chroma 84
}

export const content: SchemeConfig = {
  name: 'content',
  primaryHueOffset: 0,
  primarySaturation: 'source',
  secondaryHueOffset: 0,
  secondarySaturation: { factor: 0.33 },
  tertiaryHueOffset: 'analogous',
  tertiarySaturation: { factor: 0.5 },
  neutralHueOffset: 0,
  neutralSaturation: { factor: 0.125 },
  neutralVariantHueOffset: 0,
  neutralVariantSaturation: { factor: 0.125, offset: 0.04 },
  errorHue: 25,
  errorSaturation: 0.84,                // Google: chroma 84
}

export const monochrome: SchemeConfig = {
  name: 'monochrome',
  primaryHueOffset: 0,
  primarySaturation: 0.0,
  secondaryHueOffset: 0,
  secondarySaturation: 0.0,
  tertiaryHueOffset: 0,
  tertiarySaturation: 0.0,
  neutralHueOffset: 0,
  neutralSaturation: 0.0,
  neutralVariantHueOffset: 0,
  neutralVariantSaturation: 0.0,
  errorHue: 25,
  errorSaturation: 0.0,
}

export const rainbow: SchemeConfig = {
  name: 'rainbow',
  primaryHueOffset: 0,
  primarySaturation: 0.53,              // Google: chroma 48
  secondaryHueOffset: 0,
  secondarySaturation: 0.20,            // Google: chroma 16
  tertiaryHueOffset: 60,
  tertiarySaturation: 0.29,             // Google: chroma 24
  neutralHueOffset: 0,
  neutralSaturation: 0.0,
  neutralVariantHueOffset: 0,
  neutralVariantSaturation: 0.0,
  errorHue: 25,
  errorSaturation: 0.84,               // Google: chroma 84
}

export const fruitSalad: SchemeConfig = {
  name: 'fruitSalad',
  primaryHueOffset: -50,
  primarySaturation: 0.53,              // Google: chroma 48
  secondaryHueOffset: -50,
  secondarySaturation: 0.42,            // Google: chroma 36
  tertiaryHueOffset: 0,
  tertiarySaturation: 0.42,             // Google: chroma 36
  neutralHueOffset: 0,
  neutralSaturation: 0.13,              // Google: chroma 10
  neutralVariantHueOffset: 0,
  neutralVariantSaturation: 0.20,       // Google: chroma 16
  errorHue: 25,
  errorSaturation: 0.84,               // Google: chroma 84
}

export const cmf: SchemeConfig = {
  name: 'cmf',
  primaryHueOffset: 0,
  primarySaturation: 'source',
  secondaryHueOffset: 0,
  secondarySaturation: { factor: 0.5 },
  tertiaryHueOffset: 0,                 // overridden by secondarySourceColor
  tertiarySaturation: { factor: 0.75 },
  neutralHueOffset: 0,
  neutralSaturation: { factor: 0.2 },
  neutralVariantHueOffset: 0,
  neutralVariantSaturation: { factor: 0.2 },
  errorHue: 25,
  errorSaturation: { factor: 1.0, min: 0.55 },
}

export const presets: Record<string, SchemeConfig> = {
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
}
