import { RasterDocument } from './document'
import { clampRect, unionRect, type Rect } from './geometry'
import type { StrokePoint } from './input'
import type { Stroke, StrokeFactory, StrokeSettings } from './tools/types'

type Listener = () => void

/**
 * The drawing engine behind the UI. Plain TypeScript, no Vue: the store
 * holds one instance and mirrors the few flags the interface needs.
 */
export class Editor {
  doc: RasterDocument
  private renderListeners = new Set<Listener>()
  private stroke: Stroke | null = null
  /** Everything the current stroke has touched, in image pixels. */
  private strokeArea: Rect | null = null

  constructor(width: number, height: number) {
    this.doc = new RasterDocument(width, height)
  }

  get isStroking(): boolean {
    return this.stroke !== null
  }

  beginStroke(tool: StrokeFactory, settings: StrokeSettings, point: StrokePoint): void {
    this.cancelStroke()
    this.stroke = tool(this.doc.ctx, settings)
    this.strokeArea = null
    this.track(this.stroke.add(point))
  }

  extendStroke(points: readonly StrokePoint[]): void {
    if (!this.stroke) return
    for (const point of points) this.track(this.stroke.add(point))
  }

  /** Finishes the stroke and returns the area it changed, clipped to the image. */
  endStroke(): Rect | null {
    if (!this.stroke) return null
    this.track(this.stroke.finish())
    const area = this.strokeArea && clampRect(this.strokeArea, this.doc.width, this.doc.height)
    this.stroke = null
    this.strokeArea = null
    return area
  }

  cancelStroke(): void {
    this.stroke = null
    this.strokeArea = null
  }

  /** Called whenever pixels change and the screen must be repainted. */
  onRender(listener: Listener): () => void {
    this.renderListeners.add(listener)
    return () => this.renderListeners.delete(listener)
  }

  protected requestRender(): void {
    for (const listener of this.renderListeners) listener()
  }

  private track(rect: Rect | null): void {
    if (!rect) return
    this.strokeArea = unionRect(this.strokeArea, rect)
    this.requestRender()
  }
}
