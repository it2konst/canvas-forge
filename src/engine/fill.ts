import type { RGBA } from './color'
import type { Rect } from './geometry'

/** The parts of ImageData the fill needs; plain objects work in tests. */
export interface PixelBuffer {
  readonly width: number
  readonly height: number
  readonly data: Uint8ClampedArray
}

/**
 * Paint-style flood fill: recolours the contiguous area around (x, y) whose
 * pixels are close to the one clicked. Tolerance is 0..100: 0 takes exactly
 * the same colour, higher values also take similar ones, which helps with
 * anti-aliased edges. Every channel, alpha included, must be within it.
 *
 * Scanline algorithm: fills whole horizontal runs and queues one seed per
 * run on the rows above and below, so it handles millions of pixels without
 * recursion. Writes into `image` and returns the changed area, or null
 * when no pixel actually changed (so no empty undo step is recorded).
 */
export function floodFill(
  image: PixelBuffer,
  x: number,
  y: number,
  color: RGBA,
  tolerance: number,
): Rect | null {
  const { width, height, data } = image
  if (x < 0 || y < 0 || x >= width || y >= height) return null

  const start = (y * width + x) * 4
  const seed = [data[start]!, data[start + 1]!, data[start + 2]!, data[start + 3]!]
  const limit = Math.round((Math.min(100, Math.max(0, tolerance)) / 100) * 255)

  // Filling a colour with itself changes nothing.
  if (limit === 0 && seed.every((v, i) => v === color[i])) return null

  const done = new Uint8Array(width * height)
  const matches = (pixel: number): boolean => {
    if (done[pixel]) return false
    const i = pixel * 4
    return (
      Math.abs(data[i]! - seed[0]!) <= limit &&
      Math.abs(data[i + 1]! - seed[1]!) <= limit &&
      Math.abs(data[i + 2]! - seed[2]!) <= limit &&
      Math.abs(data[i + 3]! - seed[3]!) <= limit
    )
  }

  let minX = x
  let maxX = x
  let minY = y
  let maxY = y
  const stack: number[] = [x, y]
  let changed = false

  while (stack.length) {
    const sy = stack.pop()!
    const sx = stack.pop()!
    const row = sy * width
    if (!matches(row + sx)) continue

    let left = sx
    while (left > 0 && matches(row + left - 1)) left--
    let right = sx
    while (right < width - 1 && matches(row + right + 1)) right++

    for (let px = left; px <= right; px++) {
      const pixel = row + px
      done[pixel] = 1
      const i = pixel * 4
      if (
        data[i] !== color[0] ||
        data[i + 1] !== color[1] ||
        data[i + 2] !== color[2] ||
        data[i + 3] !== color[3]
      ) {
        data.set(color, i)
        changed = true
      }
    }
    if (left < minX) minX = left
    if (right > maxX) maxX = right
    if (sy < minY) minY = sy
    if (sy > maxY) maxY = sy

    // One seed per run of matching pixels in the neighbouring rows.
    for (const ny of [sy - 1, sy + 1]) {
      if (ny < 0 || ny >= height) continue
      const nrow = ny * width
      let inRun = false
      for (let px = left; px <= right; px++) {
        const m = matches(nrow + px)
        if (m && !inRun) stack.push(px, ny)
        inRun = m
      }
    }
  }

  if (!changed) return null
  return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 }
}
