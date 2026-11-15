import { RasterDocument } from './document'
import { clampRect, unionRect, type Rect } from './geometry'
import { History, type HistoryEntry } from './history'
import type { StrokePoint } from './input'
import type { Stroke, StrokeFactory, StrokeSettings } from './tools/types'

type Listener = () => void

/** One undoable change: the pixels of an area before and after it. */
interface Patch extends HistoryEntry {
  rect: Rect
  before: ImageData
  after: ImageData
}

const HISTORY_LIMITS = {
  maxSteps: 100,
  maxBytes: 256 * 1024 * 1024,
}

/**
 * The drawing engine behind the UI. Plain TypeScript, no Vue: the store
 * holds one instance and mirrors the few flags the interface needs.
 */
export class Editor {
  doc: RasterDocument
  private readonly history = new History<Patch>(HISTORY_LIMITS)
  private renderListeners = new Set<Listener>()
  private historyListeners = new Set<Listener>()

  private stroke: Stroke | null = null
  /** Everything the current stroke has touched, in image pixels. */
  private strokeArea: Rect | null = null
  /**
   * Copy of the image taken when a stroke starts. Copying the canvas is a
   * fast GPU operation; only the area the stroke touched is read back later.
   */
  private readonly snapshot: HTMLCanvasElement
  private readonly snapshotCtx: CanvasRenderingContext2D

  constructor(width: number, height: number) {
    this.doc = new RasterDocument(width, height)
    this.snapshot = document.createElement('canvas')
    this.snapshot.width = width
    this.snapshot.height = height
    // Only ever copied into and read back from, so keep it in CPU memory.
    this.snapshotCtx = this.snapshot.getContext('2d', { willReadFrequently: true })!
  }

  get isStroking(): boolean {
    return this.stroke !== null
  }

  get canUndo(): boolean {
    return this.history.canUndo
  }

  get canRedo(): boolean {
    return this.history.canRedo
  }

  // --- Strokes -----------------------------------------------------------

  beginStroke(tool: StrokeFactory, settings: StrokeSettings, point: StrokePoint): void {
    this.cancelStroke()
    this.snapshotCtx.clearRect(0, 0, this.snapshot.width, this.snapshot.height)
    this.snapshotCtx.drawImage(this.doc.canvas, 0, 0)
    this.stroke = tool(this.doc.ctx, settings)
    this.strokeArea = null
    this.track(this.stroke.add(point))
  }

  extendStroke(points: readonly StrokePoint[]): void {
    if (!this.stroke) return
    for (const point of points) this.track(this.stroke.add(point))
  }

  /** Finishes the stroke, records it for undo and returns the area it changed. */
  endStroke(): Rect | null {
    if (!this.stroke) return null
    this.track(this.stroke.finish())
    const area = this.strokeArea && clampRect(this.strokeArea, this.doc.width, this.doc.height)
    this.stroke = null
    this.strokeArea = null

    if (area) {
      const { x, y, width, height } = area
      const before = this.snapshotCtx.getImageData(x, y, width, height)
      // Read the result through the snapshot too: the document canvas stays
      // on the GPU for fast drawing, and the snapshot is refreshed next stroke.
      this.snapshotCtx.clearRect(x, y, width, height)
      this.snapshotCtx.drawImage(this.doc.canvas, x, y, width, height, x, y, width, height)
      const after = this.snapshotCtx.getImageData(x, y, width, height)
      this.history.push({
        rect: area,
        before,
        after,
        bytes: before.data.byteLength + after.data.byteLength,
      })
      this.notifyHistory()
    }
    return area
  }

  /** Drops the stroke in progress and restores the pixels it changed. */
  cancelStroke(): void {
    if (!this.stroke) return
    const area = this.strokeArea && clampRect(this.strokeArea, this.doc.width, this.doc.height)
    if (area) {
      this.doc.ctx.clearRect(area.x, area.y, area.width, area.height)
      this.doc.ctx.drawImage(
        this.snapshot,
        area.x,
        area.y,
        area.width,
        area.height,
        area.x,
        area.y,
        area.width,
        area.height,
      )
      this.requestRender()
    }
    this.stroke = null
    this.strokeArea = null
  }

  // --- History -------------------------------------------------------------

  undo(): boolean {
    if (this.stroke) return false
    const patch = this.history.undo()
    if (!patch) return false
    this.doc.write(patch.before, patch.rect)
    this.requestRender()
    this.notifyHistory()
    return true
  }

  redo(): boolean {
    if (this.stroke) return false
    const patch = this.history.redo()
    if (!patch) return false
    this.doc.write(patch.after, patch.rect)
    this.requestRender()
    this.notifyHistory()
    return true
  }

  // --- Events ----------------------------------------------------------------

  /** Called whenever pixels change and the screen must be repainted. */
  onRender(listener: Listener): () => void {
    this.renderListeners.add(listener)
    return () => this.renderListeners.delete(listener)
  }

  /** Called whenever undo or redo availability may have changed. */
  onHistoryChange(listener: Listener): () => void {
    this.historyListeners.add(listener)
    return () => this.historyListeners.delete(listener)
  }

  protected requestRender(): void {
    for (const listener of this.renderListeners) listener()
  }

  private notifyHistory(): void {
    for (const listener of this.historyListeners) listener()
  }

  private track(rect: Rect | null): void {
    if (!rect) return
    this.strokeArea = unionRect(this.strokeArea, rect)
    this.requestRender()
  }
}
