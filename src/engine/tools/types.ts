import type { Rect } from '../geometry'
import type { StrokePoint } from '../input'

export interface StrokeSettings {
  /** Any CSS colour. */
  color: string
  /** Tool size in image pixels. */
  size: number
  /** Remove pixels (make them transparent) instead of painting `color`. */
  erase?: boolean
}

/** One stroke in progress. Each call returns the area it painted, or null. */
export interface Stroke {
  add(point: StrokePoint): Rect | null
  finish(): Rect | null
}

/** What the engine offers a stroke besides the canvas. */
export interface StrokeEnv {
  /**
   * Puts back the pixels the area had when the stroke began. Tools with a
   * live preview (shapes) use it to erase the previous preview frame.
   */
  restore(rect: Rect): void
}

/** A painting tool: starts a new stroke on the given context. */
export type StrokeFactory<S extends StrokeSettings = StrokeSettings> = (
  ctx: CanvasRenderingContext2D,
  settings: S,
  env: StrokeEnv,
) => Stroke
