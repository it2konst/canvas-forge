import type { Point, Rect } from './geometry'
import type { Size } from './view'

/**
 * Rectangle between two pointer positions, in whole pixels with both
 * corner pixels included, clipped to the image. Null when it is empty.
 */
export function rectFromPoints(a: Point, b: Point, image: Size): Rect | null {
  const x0 = Math.max(0, Math.min(Math.floor(a.x), Math.floor(b.x)))
  const y0 = Math.max(0, Math.min(Math.floor(a.y), Math.floor(b.y)))
  const x1 = Math.min(image.width - 1, Math.max(Math.floor(a.x), Math.floor(b.x)))
  const y1 = Math.min(image.height - 1, Math.max(Math.floor(a.y), Math.floor(b.y)))
  if (x1 < x0 || y1 < y0) return null
  return { x: x0, y: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 }
}

export const containsPoint = (r: Rect, p: Point): boolean =>
  p.x >= r.x && p.y >= r.y && p.x < r.x + r.width && p.y < r.y + r.height

/**
 * Where a pasted picture goes: the top-left corner of the visible part of
 * the image, so it appears where the user is looking.
 */
export function pastePosition(visibleTopLeft: Point, image: Size): Point {
  return {
    x: Math.min(Math.max(0, Math.ceil(visibleTopLeft.x)), Math.max(0, image.width - 1)),
    y: Math.min(Math.max(0, Math.ceil(visibleTopLeft.y)), Math.max(0, image.height - 1)),
  }
}
