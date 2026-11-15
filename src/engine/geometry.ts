export interface Point {
  x: number
  y: number
}

/** Axis-aligned rectangle in whole image pixels. */
export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

/** Smallest whole-pixel rectangle that covers a circle or square of the given radius. */
export function rectAround(p: Point, radius: number): Rect {
  const x = Math.floor(p.x - radius)
  const y = Math.floor(p.y - radius)
  return {
    x,
    y,
    width: Math.ceil(p.x + radius) - x,
    height: Math.ceil(p.y + radius) - y,
  }
}

export function unionRect(a: Rect | null, b: Rect): Rect {
  if (!a) return { ...b }
  const x = Math.min(a.x, b.x)
  const y = Math.min(a.y, b.y)
  return {
    x,
    y,
    width: Math.max(a.x + a.width, b.x + b.width) - x,
    height: Math.max(a.y + a.height, b.y + b.height) - y,
  }
}

/** Clips a rectangle to the image; null when nothing is left. */
export function clampRect(r: Rect, width: number, height: number): Rect | null {
  const x = Math.max(0, r.x)
  const y = Math.max(0, r.y)
  const right = Math.min(width, r.x + r.width)
  const bottom = Math.min(height, r.y + r.height)
  if (right <= x || bottom <= y) return null
  return { x, y, width: right - x, height: bottom - y }
}

export const midpoint = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })

/**
 * Visits every pixel of a straight line between two whole-pixel points
 * (Bresenham), including both ends. Used by hard-edged tools.
 */
export function forEachLinePixel(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  visit: (x: number, y: number) => void,
): void {
  const dx = Math.abs(x1 - x0)
  const dy = -Math.abs(y1 - y0)
  const sx = x0 < x1 ? 1 : -1
  const sy = y0 < y1 ? 1 : -1
  let err = dx + dy
  let x = x0
  let y = y0
  for (;;) {
    visit(x, y)
    if (x === x1 && y === y1) return
    const e2 = 2 * err
    if (e2 >= dy) {
      err += dy
      x += sx
    }
    if (e2 <= dx) {
      err += dx
      y += sy
    }
  }
}
