/** Red, green, blue and alpha, each 0..255. */
export type RGBA = readonly [number, number, number, number]

/** Parses #RGB, #RGBA, #RRGGBB or #RRGGBBAA (case-insensitive). */
export function parseHex(hex: string): RGBA {
  const m = /^#?([\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i.exec(hex.trim())
  if (!m) throw new Error(`Not a hex colour: ${hex}`)
  let digits = m[1]!
  if (digits.length <= 4) digits = [...digits].map((d) => d + d).join('')
  const n = (i: number) => parseInt(digits.slice(i, i + 2), 16)
  return [n(0), n(2), n(4), digits.length === 8 ? n(6) : 255]
}

const hex2 = (n: number) => n.toString(16).padStart(2, '0').toUpperCase()

/** #RRGGBB; alpha is dropped because colour 1 and colour 2 are opaque. */
export const toHex = (r: number, g: number, b: number): string => `#${hex2(r)}${hex2(g)}${hex2(b)}`
