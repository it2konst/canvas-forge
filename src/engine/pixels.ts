import { toHex } from './color'

/** The parts of ImageData the engine reads; plain objects work in tests. */
export interface PixelBuffer {
  readonly width: number
  readonly height: number
  readonly data: Uint8ClampedArray
}

/** Colour of one pixel as #RRGGBB, or null outside the image. */
export function sampleHex(image: PixelBuffer, x: number, y: number): string | null {
  const px = Math.floor(x)
  const py = Math.floor(y)
  if (px < 0 || py < 0 || px >= image.width || py >= image.height) return null
  const i = (py * image.width + px) * 4
  return toHex(image.data[i]!, image.data[i + 1]!, image.data[i + 2]!)
}
