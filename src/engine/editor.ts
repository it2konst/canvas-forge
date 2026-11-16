import { parseHex } from './color'
import { RasterDocument } from './document'
import { floodFill } from './fill'
import { clampRect, unionRect, type Point, type Rect } from './geometry'
import { History, type HistoryEntry } from './history'
import type { StrokePoint } from './input'
import type { Stroke, StrokeEnv, StrokeFactory, StrokeSettings } from './tools/types'

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
 *
 * Every change follows the same pattern: copy the image to the snapshot,
 * draw on the document, then record the touched area before and after.
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
   * Copy of the image taken before each change. Copying the canvas is a fast
   * GPU operation; only the area that changed is read back afterwards.
   */
  private readonly snapshot: HTMLCanvasElement
  private readonly snapshotCtx: CanvasRenderingContext2D
  private readonly strokeEnv: StrokeEnv = { restore: (rect) => this.restore(rect) }

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

  beginStroke<S extends StrokeSettings>(
    tool: StrokeFactory<S>,
    settings: S,
    point: StrokePoint,
  ): void {
    this.cancelStroke()
    this.takeSnapshot()
    this.stroke = tool(this.doc.ctx, settings, this.strokeEnv)
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
    const area = this.clip(this.strokeArea)
    this.stroke = null
    this.strokeArea = null
    if (area) this.record(area)
    return area
  }

  /** Drops the stroke in progress and restores the pixels it changed. */
  cancelStroke(): void {
    if (!this.stroke) return
    const area = this.clip(this.strokeArea)
    if (area) {
      this.restore(area)
      this.requestRender()
    }
    this.stroke = null
    this.strokeArea = null
  }

  // --- One-shot edits ------------------------------------------------------

  /**
   * Runs a single undoable change. `change` draws on the document and returns
   * the area it touched, or null if nothing changed.
   */
  edit(change: (ctx: CanvasRenderingContext2D) => Rect | null): Rect | null {
    if (this.stroke) return null
    this.takeSnapshot()
    const area = this.clip(change(this.doc.ctx))
    if (area) {
      this.record(area)
      this.requestRender()
    }
    return area
  }

  /** Flood-fills the area around a point; see floodFill for tolerance. */
  fill(point: Point, color: string, tolerance: number): Rect | null {
    if (this.stroke) return null
    const image = this.readImage()
    const area = floodFill(
      image,
      Math.floor(point.x),
      Math.floor(point.y),
      parseHex(color),
      tolerance,
    )
    if (!area) return null
    // Only the changed area goes back to the GPU.
    this.doc.ctx.putImageData(image, 0, 0, area.x, area.y, area.width, area.height)
    this.record(area)
    this.requestRender()
    return area
  }

  /**
   * Pixels of the whole image, read on the CPU. Cheap to sample many times;
   * a fresh copy reflects every change made so far.
   */
  readImage(): ImageData {
    this.takeSnapshot()
    return this.snapshotCtx.getImageData(0, 0, this.doc.width, this.doc.height)
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

  // --- Internals -------------------------------------------------------------

  private notifyHistory(): void {
    for (const listener of this.historyListeners) listener()
  }

  private clip(rect: Rect | null): Rect | null {
    return rect && clampRect(rect, this.doc.width, this.doc.height)
  }

  private takeSnapshot(): void {
    this.snapshotCtx.clearRect(0, 0, this.snapshot.width, this.snapshot.height)
    this.snapshotCtx.drawImage(this.doc.canvas, 0, 0)
  }

  /** Copies an area back from the snapshot onto the document. */
  private restore(rect: Rect): void {
    const area = this.clip(rect)
    if (!area) return
    const { x, y, width, height } = area
    this.doc.ctx.clearRect(x, y, width, height)
    this.doc.ctx.drawImage(this.snapshot, x, y, width, height, x, y, width, height)
  }

  /** Stores an area before (from the snapshot) and after (from the document) for undo. */
  private record(area: Rect): void {
    const { x, y, width, height } = area
    const before = this.snapshotCtx.getImageData(x, y, width, height)
    // Read the result through the snapshot too: the document canvas stays
    // on the GPU for fast drawing, and the snapshot is refreshed next change.
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

  private track(rect: Rect | null): void {
    if (!rect) return
    this.strokeArea = unionRect(this.strokeArea, rect)
    this.requestRender()
  }
}
