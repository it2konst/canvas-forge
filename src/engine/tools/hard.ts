import { forEachLinePixel, type Point, type Rect } from '../geometry'
import type { StrokeFactory } from './types'

/**
 * Hard-edged square stamps along whole-pixel lines, without anti-aliasing:
 * the classic Paint pencil and eraser. Good for pixel art and clean edges.
 */
export const hardSquareStroke: StrokeFactory = (ctx, { color, size }) => {
  const side = Math.max(1, Math.round(size))
  // Centre the square on the pixel under the cursor (left/top-biased for even sizes).
  const offset = Math.floor(side / 2)
  let last: Point | null = null

  const stamp = (x: number, y: number) => ctx.fillRect(x - offset, y - offset, side, side)

  return {
    add(point) {
      const x = Math.floor(point.x)
      const y = Math.floor(point.y)
      if (last && last.x === x && last.y === y) return null

      const from = last ?? { x, y }
      ctx.globalCompositeOperation = 'source-over'
      ctx.globalAlpha = 1
      ctx.fillStyle = color
      forEachLinePixel(from.x, from.y, x, y, stamp)
      last = { x, y }

      const area: Rect = {
        x: Math.min(from.x, x) - offset,
        y: Math.min(from.y, y) - offset,
        width: Math.abs(x - from.x) + side,
        height: Math.abs(y - from.y) + side,
      }
      return area
    },
    finish: () => null,
  }
}
