import { parseHex, harmonizeHsl, formatHex } from './color.js'

/**
 * Shift a design color's hue toward a source color while preserving identity.
 * Both inputs and output are sRGB hex strings.
 */
export function harmonize(designColorHex: string, sourceColorHex: string): string {
  const design = parseHex(designColorHex)
  const source = parseHex(sourceColorHex)
  const result = harmonizeHsl(design, source)
  return formatHex(result)
}
