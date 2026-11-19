import { parseHex } from './color'
import { RasterDocument } from './document'
import { floodFill } from './fill'
import { clampRect, unionRect, type Point, type Rect } from './geometry'
import { containsPoint } from './selection'
import { History, type HistoryEntry } from './history'
import type { StrokePoint } from './input'
import { drawText, fontShorthand, type TextStyle } from './tools/text'
import { anchorOffset, smoothScaling, type ResizeOperation } from './resize'
import type { Stroke, StrokeEnv, StrokeFactory, StrokeSettings } from './tools/types'

type Listener = () => void

/**
 * Pixels lifted off the image (being moved) or pasted, drawn on top of it
 * until they are put down. `source` is where they were cut from, if anywhere.
 */
interface Floating {
  canvas: HTMLCanvasElement
  x: number
  y: number
  source: Rect | null
}

/**
 * One undoable change: the pixels of an area before and after it, or the
 * whole image before and after a change of size.
 */
type Patch = HistoryEntry &
  (
    | { kind: 'pixels'; rect: Rect; before: ImageData; after: ImageData }
    | { kind: 'image'; before: ImageData; after: ImageData }
  )

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
  private sizeListeners = new Set<Listener>()
  private selectionListeners = new Set<Listener>()

  private selectionRect: Rect | null = null
  private float: Floating | null = null

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
    this.settle()
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
    this.settle()
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
    this.settle()
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
   * Draws text as one undoable step. Waits for the font so the first use of
   * a web font does not fall back to a system one.
   */
  async addText(at: Point, text: string, style: TextStyle): Promise<Rect | null> {
    try {
      await document.fonts.load(fontShorthand(style), text)
    } catch {
      // Draw with whatever is available rather than lose the text.
    }
    return this.edit((ctx) => drawText(ctx, at, text, style))
  }

  /**
   * Pixels of the whole image, read on the CPU. Cheap to sample many times;
   * a fresh copy reflects every change made so far.
   */
  readImage(): ImageData {
    this.takeSnapshot()
    return this.snapshotCtx.getImageData(0, 0, this.doc.width, this.doc.height)
  }

  // --- Size -----------------------------------------------------------------

  /** Scales the picture or changes the canvas around it, as one undoable step. */
  resize(op: ResizeOperation): boolean {
    const from = { width: this.doc.width, height: this.doc.height }
    if (from.width === op.width && from.height === op.height) return false
    return this.replaceImage(op.width, op.height, (ctx, old) => {
      if (op.kind === 'scale') {
        ctx.imageSmoothingEnabled = smoothScaling(from, op)
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(old, 0, 0, op.width, op.height)
      } else {
        ctx.fillStyle = op.fill
        ctx.fillRect(0, 0, op.width, op.height)
        const at = anchorOffset(from, op, op.anchor)
        ctx.drawImage(old, at.x, at.y)
      }
    })
  }

  /** A blank image of the given size, as one undoable step. */
  newImage(width: number, height: number, background: string): boolean {
    return this.replaceImage(width, height, (ctx) => {
      ctx.fillStyle = background
      ctx.fillRect(0, 0, width, height)
    })
  }

  /** Puts an opened picture in place of the current one, as one undoable step. */
  openImage(picture: CanvasImageSource, width: number, height: number): boolean {
    return this.replaceImage(width, height, (ctx) => {
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(picture, 0, 0, width, height)
    })
  }

  /**
   * Starts over with this picture (or a white sheet) and an empty history.
   * Used when an autosaved image is restored on start.
   */
  reset(picture: CanvasImageSource | null, width: number, height: number): void {
    this.cancelStroke()
    this.float = null
    this.selectionRect = null
    this.notifySelection()
    this.doc.resize(width, height, (ctx) => {
      if (picture) {
        ctx.drawImage(picture, 0, 0, width, height)
      } else {
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, width, height)
      }
    })
    this.matchSnapshot()
    this.history.clear()
    this.notifySize()
    this.notifyHistory()
    this.requestRender()
  }

  /**
   * Replaces the whole image, size included, as one undoable step. `redraw`
   * paints the new content and gets a copy of the old picture.
   */
  private replaceImage(
    width: number,
    height: number,
    redraw: (ctx: CanvasRenderingContext2D, old: HTMLCanvasElement) => void,
  ): boolean {
    if (this.stroke) return false
    this.settle()
    this.selectionRect = null
    this.notifySelection()
    const before = this.readImage()
    this.doc.resize(width, height, redraw)
    this.matchSnapshot()
    const after = this.readImage()

    this.history.push({
      kind: 'image',
      before,
      after,
      bytes: before.data.byteLength + after.data.byteLength,
    })
    this.notifySize()
    this.notifyHistory()
    this.requestRender()
    return true
  }

  // --- Selection ------------------------------------------------------------

  /** The selected area: the floating pixels while they move, else the selection. */
  get selection(): Rect | null {
    if (this.float) {
      const { x, y, canvas } = this.float
      return { x, y, width: canvas.width, height: canvas.height }
    }
    return this.selectionRect
  }

  get floating(): Readonly<Floating> | null {
    return this.float
  }

  /** Selects an area (or nothing), putting down anything that floats first. */
  select(rect: Rect | null): void {
    this.settle()
    this.selectionRect = rect && this.clip(rect)
    this.notifySelection()
    this.requestRender()
  }

  selectAll(): void {
    this.select({ x: 0, y: 0, width: this.doc.width, height: this.doc.height })
  }

  isInSelection(p: Point): boolean {
    const sel = this.selection
    return sel !== null && containsPoint(sel, p)
  }

  /**
   * Lifts the selected pixels so they can be moved. Without `fill` it is a
   * copy and the original stays; with it the hole is filled with that
   * colour, as Paint fills it with colour 2.
   */
  lift(fill: string | null): boolean {
    if (this.stroke || this.float || !this.selectionRect) return false
    const sel = this.selectionRect
    this.takeSnapshot()
    const canvas = this.copyArea(sel)
    if (fill) {
      this.doc.ctx.globalCompositeOperation = 'source-over'
      this.doc.ctx.globalAlpha = 1
      this.doc.ctx.fillStyle = fill
      this.doc.ctx.clearRect(sel.x, sel.y, sel.width, sel.height)
      this.doc.ctx.fillRect(sel.x, sel.y, sel.width, sel.height)
    }
    this.float = { canvas, x: sel.x, y: sel.y, source: fill ? sel : null }
    this.notifySelection()
    this.requestRender()
    return true
  }

  moveFloating(x: number, y: number): void {
    if (!this.float) return
    this.float.x = Math.round(x)
    this.float.y = Math.round(y)
    this.notifySelection()
    this.requestRender()
  }

  /** Floats a pasted picture at a point, on top of the image. */
  pasteFloating(picture: CanvasImageSource, width: number, height: number, at: Point): void {
    this.cancelStroke()
    this.settle()
    this.takeSnapshot()
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    canvas.getContext('2d')!.drawImage(picture, 0, 0, width, height)
    this.float = { canvas, x: Math.round(at.x), y: Math.round(at.y), source: null }
    this.notifySelection()
    this.requestRender()
  }

  /** Puts floating pixels down: one undo step covers the lift and the move. */
  commitFloating(): void {
    const f = this.float
    if (!f) return
    this.float = null
    const dest = { x: f.x, y: f.y, width: f.canvas.width, height: f.canvas.height }
    this.doc.ctx.globalCompositeOperation = 'source-over'
    this.doc.ctx.globalAlpha = 1
    this.doc.ctx.drawImage(f.canvas, f.x, f.y)
    this.selectionRect = this.clip(dest)
    const area = this.clip(f.source ? unionRect(f.source, dest) : dest)
    if (area) this.record(area)
    this.notifySelection()
    this.requestRender()
  }

  /** Drops floating pixels and restores what was under them. */
  cancelFloating(): void {
    const f = this.float
    if (!f) return
    this.float = null
    if (f.source) this.restore(f.source)
    this.selectionRect = f.source
    this.notifySelection()
    this.requestRender()
  }

  /** Clears the selected pixels to a colour, as one undo step. */
  deleteSelection(fill: string): void {
    const f = this.float
    if (f) {
      // The hole is already there; just forget the lifted pixels.
      this.float = null
      this.selectionRect = null
      if (f.source) this.record(f.source)
      this.notifySelection()
      this.requestRender()
      return
    }
    const sel = this.selectionRect
    if (!sel) return
    this.edit((ctx) => {
      ctx.globalCompositeOperation = 'source-over'
      ctx.globalAlpha = 1
      ctx.fillStyle = fill
      ctx.clearRect(sel.x, sel.y, sel.width, sel.height)
      ctx.fillRect(sel.x, sel.y, sel.width, sel.height)
      return sel
    })
    this.selectionRect = null
    this.notifySelection()
  }

  /** Cuts the image down to the selection, as one undo step. */
  crop(): boolean {
    this.settle()
    const sel = this.selectionRect
    if (!sel) return false
    return this.replaceImage(sel.width, sel.height, (ctx, old) =>
      ctx.drawImage(old, -sel.x, -sel.y),
    )
  }

  /** The selected pixels (or the whole image) as a new canvas, for copying. */
  copySelection(): HTMLCanvasElement {
    if (this.float) return this.copyCanvas(this.float.canvas)
    return this.copyArea(
      this.selectionRect ?? { x: 0, y: 0, width: this.doc.width, height: this.doc.height },
    )
  }

  /** Puts down anything floating; called before every other change. */
  settle(): void {
    if (this.float) this.commitFloating()
  }

  // --- History -------------------------------------------------------------

  undo(): boolean {
    if (this.stroke) return false
    // Undo while moving a selection puts it back where it came from.
    if (this.float) {
      this.cancelFloating()
      return true
    }
    const patch = this.history.undo()
    if (!patch) return false
    this.apply(patch, 'before')
    this.requestRender()
    this.notifyHistory()
    return true
  }

  redo(): boolean {
    if (this.stroke) return false
    this.settle()
    const patch = this.history.redo()
    if (!patch) return false
    this.apply(patch, 'after')
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

  /** Called whenever the image changes size, including by undo and redo. */
  onSizeChange(listener: Listener): () => void {
    this.sizeListeners.add(listener)
    return () => this.sizeListeners.delete(listener)
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

  /** Called when the selection or the floating pixels change. */
  onSelectionChange(listener: Listener): () => void {
    this.selectionListeners.add(listener)
    return () => this.selectionListeners.delete(listener)
  }

  private notifySelection(): void {
    for (const listener of this.selectionListeners) listener()
  }

  private copyArea(rect: Rect): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    canvas.width = rect.width
    canvas.height = rect.height
    canvas
      .getContext('2d')!
      .drawImage(
        this.doc.canvas,
        rect.x,
        rect.y,
        rect.width,
        rect.height,
        0,
        0,
        rect.width,
        rect.height,
      )
    return canvas
  }

  private copyCanvas(source: HTMLCanvasElement): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    canvas.width = source.width
    canvas.height = source.height
    canvas.getContext('2d')!.drawImage(source, 0, 0)
    return canvas
  }

  private notifySize(): void {
    for (const listener of this.sizeListeners) listener()
  }

  private apply(patch: Patch, side: 'before' | 'after'): void {
    const image = patch[side]
    if (patch.kind === 'pixels') {
      this.doc.write(image, patch.rect)
      return
    }
    this.doc.replace(image)
    this.matchSnapshot()
    this.selectionRect = null
    this.notifySelection()
    this.notifySize()
  }

  /** The snapshot always has the document's size. */
  private matchSnapshot(): void {
    if (this.snapshot.width === this.doc.width && this.snapshot.height === this.doc.height) return
    this.snapshot.width = this.doc.width
    this.snapshot.height = this.doc.height
  }

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
      kind: 'pixels',
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
