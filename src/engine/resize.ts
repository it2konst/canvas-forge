import type { Point } from './geometry'
import type { Size } from './view'

/** Largest side the editor accepts; bigger canvases exhaust memory in most browsers. */
export const MAX_SIDE = 8192

/** Where the old image sits in a resized canvas: 0 = left/top, 0.5 = centre, 1 = right/bottom. */
export interface Anchor {
  x: 0 | 0.5 | 1
  y: 0 | 0.5 | 1
}

export type ResizeOperation =
  /** Stretch or shrink the picture itself. */
  | { kind: 'scale'; width: number; height: number }
  /** Change the sheet: crop or add space, filled with `fill`, around the anchored picture. */
  | { kind: 'canvas'; width: number; height: number; anchor: Anchor; fill: string }

export const clampSide = (n: number) => Math.min(MAX_SIDE, Math.max(1, Math.round(n) || 1))

/** Where the old image's top-left corner lands in the new canvas. */
export function anchorOffset(from: Size, to: Size, anchor: Anchor): Point {
  return {
    x: Math.round((to.width - from.width) * anchor.x),
    y: Math.round((to.height - from.height) * anchor.y),
  }
}

/** Keeps the aspect ratio when one side is typed in. */
export function keepAspect(from: Size, changed: 'width' | 'height', value: number): Size {
  const side = clampSide(value)
  if (changed === 'width') {
    return { width: side, height: clampSide((side * from.height) / from.width) }
  }
  return { width: clampSide((side * from.width) / from.height), height: side }
}

/**
 * Pixel art enlarged by whole factors stays crisp; everything else is
 * resampled smoothly.
 */
export function smoothScaling(from: Size, to: Size): boolean {
  const fx = to.width / from.width
  const fy = to.height / from.height
  return !(Number.isInteger(fx) && Number.isInteger(fy) && fx >= 1 && fy >= 1)
}
