import type { Rect } from '../geometry'
import type { StrokePoint } from '../input'

export interface StrokeSettings {
  /** Any CSS colour. */
  color: string
  /** Tool size in image pixels. */
  size: number
}

/** One stroke in progress. Each call returns the area it painted, or null. */
export interface Stroke {
  add(point: StrokePoint): Rect | null
  finish(): Rect | null
}

/** A painting tool: starts a new stroke on the given context. */
export type StrokeFactory = (ctx: CanvasRenderingContext2D, settings: StrokeSettings) => Stroke
