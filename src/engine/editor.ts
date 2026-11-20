import { parseHex } from './color'
import { RasterDocument, type Layer, type Structure } from './document'
import { floodFill } from './fill'
import { clampRect, unionRect, type Point, type Rect } from './geometry'
import { containsPoint } from './selection'
import { History, type HistoryEntry } from './history'
import type { StrokePoint } from './input'
import { MAX_LAYERS, indexAfterRemoval } from './layers'
import { drawText, fontShorthand, type TextStyle } from './tools/text'
import { anchorOffset, smoothScaling, type ResizeOperation } from './resize'
import type { Stroke, StrokeEnv, StrokeFactory, StrokeSettings } from './tools/types'

type Listener = () => void

/**
 * Pixels lifted off a layer (being moved) or pasted, drawn on top of it
 * until they are put down. `source` is where they were cut from, if anywhere.
 */
interface Floating {
  layer: Layer
  canvas: HTMLCanvasElement
  x: number
  y: number
  source: Rect | null
}

/** Every layer's pixels plus the layer list: what a size change replaces. */
interface DocState {
  width: number
  height: number
  structure: Structure
  images: { layer: Layer; image: ImageData }[]
}

/** A layer to start a document with (restoring an autosave). */
export interface LayerSpec {
  name: string
  visible: boolean
  opacity: number
  picture: CanvasImageSource | null
}

/**
 * One undoable change:
 * - pixels: an area of one layer before and after
 * - document: every layer before and after a change of size, open or new
 * - layers: the layer list before and after (add, delete, reorder, settings)
 * - compound: several of these as one step (merge down)
 */
type Patch = HistoryEntry &
  (
    | { kind: 'pixels'; layer: Layer; rect: Rect; before: ImageData; after: ImageData }
    | { kind: 'document'; before: DocState; after: DocState }
    | { kind: 'layers'; before: Structure; after: Structure }
    | { kind: 'compound'; steps: Patch[] }
  )

const HISTORY_LIMITS = {
  maxSteps: 100,
  maxBytes: 256 * 1024 * 1024,
}

/**
 * The drawing engine behind the UI. Plain TypeScript, no Vue: the store
 * holds one instance and mirrors the few flags the interface needs.
 *
 * Every pixel change follows the same pattern: copy the active layer to the
 * snapshot, draw on the layer, then record the touched area before and after.
 */
export class Editor {
  doc: RasterDocument
  private readonly history = new History<Patch>(HISTORY_LIMITS)
  private renderListeners = new Set<Listener>()
  private historyListeners = new Set<Listener>()
  private sizeListeners = new Set<Listener>()
  private selectionListeners = new Set<Listener>()
  private layerListeners = new Set<Listener>()

  private selectionRect: Rect | null = null
  private float: Floating | null = null
  /** Layer list when an opacity drag started, so the drag is one undo step. */
  private opacityStart: Structure | null = null

  private stroke: Stroke | null = null
  /** Everything the current stroke has touched, in image pixels. */
  private strokeArea: Rect | null = null
  /**
   * Copy of a layer taken before each change. Copying a canvas is a fast GPU
   * operation; only the area that changed is read back afterwards.
   */
  private readonly snapshot: HTMLCanvasElement
  private readonly snapshotCtx: CanvasRenderingContext2D
  private readonly strokeEnv: StrokeEnv = { restore: (rect) => this.restore(rect) }

  constructor(width: number, height: number, backgroundName = 'Background') {
    this.doc = new RasterDocument(width, height, '#FFFFFF', backgroundName)
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
    this.stroke = tool(this.doc.active.ctx, settings, this.strokeEnv)
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
   * Runs a single undoable change on the active layer. `change` draws and
   * returns the area it touched, or null if nothing changed.
   */
  edit(change: (ctx: CanvasRenderingContext2D) => Rect | null): Rect | null {
    if (this.stroke) return null
    this.settle()
    this.takeSnapshot()
    const area = this.clip(change(this.doc.active.ctx))
    if (area) {
      this.record(area)
      this.requestRender()
    }
    return area
  }

  /** Flood-fills the active layer around a point; see floodFill for tolerance. */
  fill(point: Point, color: string, tolerance: number): Rect | null {
    if (this.stroke) return null
    this.settle()
    this.takeSnapshot()
    const image = this.snapshotCtx.getImageData(0, 0, this.doc.width, this.doc.height)
    const area = floodFill(
      image,
      Math.floor(point.x),
      Math.floor(point.y),
      parseHex(color),
      tolerance,
    )
    if (!area) return null
    // Only the changed area goes back to the GPU.
    this.doc.active.ctx.putImageData(image, 0, 0, area.x, area.y, area.width, area.height)
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
   * The picture as it looks (all visible layers), read on the CPU. Cheap to
   * sample many times; a fresh copy reflects every change made so far.
   */
  readImage(): ImageData {
    this.matchSnapshot()
    this.snapshotCtx.clearRect(0, 0, this.snapshot.width, this.snapshot.height)
    this.doc.drawComposite(this.snapshotCtx)
    return this.snapshotCtx.getImageData(0, 0, this.doc.width, this.doc.height)
  }

  // --- Size and whole documents ------------------------------------------------

  /**
   * Scales the picture or changes the canvas around it, on every layer, as
   * one undoable step. New canvas space is filled on the bottom layer only;
   * upper layers stay transparent there.
   */
  resize(op: ResizeOperation): boolean {
    const from = { width: this.doc.width, height: this.doc.height }
    if (from.width === op.width && from.height === op.height) return false
    return this.replaceDocument(() =>
      this.doc.resize(op.width, op.height, (ctx, old, index) => {
        if (op.kind === 'scale') {
          ctx.imageSmoothingEnabled = smoothScaling(from, op)
          ctx.imageSmoothingQuality = 'high'
          ctx.drawImage(old, 0, 0, op.width, op.height)
        } else {
          if (index === 0) {
            ctx.fillStyle = op.fill
            ctx.fillRect(0, 0, op.width, op.height)
          }
          const at = anchorOffset(from, op, op.anchor)
          ctx.drawImage(old, at.x, at.y)
        }
      }),
    )
  }

  /** A blank single-layer image, as one undoable step. */
  newImage(width: number, height: number, background: string, layerName: string): boolean {
    return this.replaceDocument(() => {
      const layer = this.startOver(width, height, layerName)
      layer.ctx.fillStyle = background
      layer.ctx.fillRect(0, 0, width, height)
    })
  }

  /** Puts an opened picture in place of the current document, as one undoable step. */
  openImage(picture: CanvasImageSource, width: number, height: number, layerName: string): boolean {
    return this.replaceDocument(() => {
      const layer = this.startOver(width, height, layerName)
      layer.ctx.imageSmoothingQuality = 'high'
      layer.ctx.drawImage(picture, 0, 0, width, height)
    })
  }

  /**
   * Starts over with these layers and an empty history. Used when an
   * autosaved image is restored on start.
   */
  load(width: number, height: number, specs: readonly LayerSpec[], activeIndex: number): void {
    this.cancelStroke()
    this.float = null
    this.selectionRect = null
    this.doc.width = width
    this.doc.height = height
    this.doc.layers = specs.map((spec) => {
      const layer = this.doc.createLayer(spec.name)
      layer.visible = spec.visible
      layer.opacity = spec.opacity
      if (spec.picture) layer.ctx.drawImage(spec.picture, 0, 0, width, height)
      return layer
    })
    this.doc.activeIndex = Math.max(0, Math.min(activeIndex, specs.length - 1))
    this.matchSnapshot()
    this.history.clear()
    this.notifySelection()
    this.notifySize()
    this.notifyLayers()
    this.notifyHistory()
    this.requestRender()
  }

  // --- Layers ----------------------------------------------------------------

  get canAddLayer(): boolean {
    return this.doc.layers.length < MAX_LAYERS
  }

  /** Activating a layer is not an undo step; floating pixels are put down first. */
  setActiveLayer(index: number): void {
    if (index === this.doc.activeIndex || !this.doc.layers[index]) return
    this.settle()
    this.doc.activeIndex = index
    this.notifyLayers()
  }

  /** A new transparent layer above the active one. */
  addLayer(name: string): boolean {
    if (!this.canAddLayer) return false
    return this.changeStructure(
      () => this.doc.insert(this.doc.createLayer(name), this.doc.activeIndex + 1),
      this.layerBytes(),
    )
  }

  /** A copy of the active layer, pixels and settings, right above it. */
  duplicateLayer(name: string): boolean {
    if (!this.canAddLayer) return false
    return this.changeStructure(() => {
      const source = this.doc.active
      const copy = this.doc.createLayer(name)
      copy.visible = source.visible
      copy.opacity = source.opacity
      copy.ctx.drawImage(source.canvas, 0, 0)
      this.doc.insert(copy, this.doc.activeIndex + 1)
    }, this.layerBytes())
  }

  /** Removes the active layer; the last layer can not be removed. */
  deleteLayer(): boolean {
    if (this.doc.layers.length <= 1) return false
    return this.changeStructure(() => {
      const index = this.doc.activeIndex
      this.doc.remove(index)
      this.doc.activeIndex = indexAfterRemoval(index)
    }, this.layerBytes())
  }

  /** Moves the active layer up (+1) or down (-1) in the stack. */
  moveLayer(delta: 1 | -1): boolean {
    const from = this.doc.activeIndex
    const to = from + delta
    if (to < 0 || to >= this.doc.layers.length) return false
    return this.changeStructure(() => this.doc.move(from, to))
  }

  setLayerVisible(index: number, visible: boolean): boolean {
    const layer = this.doc.layers[index]
    if (!layer || layer.visible === visible) return false
    return this.changeStructure(() => (layer.visible = visible))
  }

  renameLayer(index: number, name: string): boolean {
    const layer = this.doc.layers[index]
    const clean = name.trim().slice(0, 60)
    if (!layer || !clean || clean === layer.name) return false
    return this.changeStructure(() => (layer.name = clean))
  }

  /** Shows a new opacity while a slider moves; commitOpacity() records it. */
  previewOpacity(index: number, opacity: number): void {
    const layer = this.doc.layers[index]
    if (!layer) return
    this.opacityStart ??= this.doc.structure()
    layer.opacity = opacity
    this.notifyLayers()
    this.requestRender()
  }

  /** Records an opacity change made with previewOpacity() as one undo step. */
  commitOpacity(): void {
    const before = this.opacityStart
    this.opacityStart = null
    if (!before) return
    const after = this.doc.structure()
    if (before.layers.every((l, i) => l.opacity === after.layers[i]?.opacity)) return
    this.history.push({ kind: 'layers', before, after, bytes: 0 })
    this.notifyHistory()
  }

  /** Can the active layer be merged into the one below it? */
  get canMergeDown(): boolean {
    return this.doc.activeIndex > 0 && this.doc.active.visible
  }

  /**
   * Draws the active layer, with its opacity, onto the layer below and
   * removes it. One undo step brings both back.
   */
  mergeDown(): boolean {
    if (this.stroke || !this.canMergeDown) return false
    this.settle()
    const index = this.doc.activeIndex
    const upper = this.doc.active
    const lower = this.doc.layers[index - 1]!

    this.takeSnapshot(lower)
    lower.ctx.globalCompositeOperation = 'source-over'
    lower.ctx.globalAlpha = upper.opacity
    lower.ctx.drawImage(upper.canvas, 0, 0)
    lower.ctx.globalAlpha = 1
    const pixels = this.capture(lower, {
      x: 0,
      y: 0,
      width: this.doc.width,
      height: this.doc.height,
    })

    const before = this.doc.structure()
    this.doc.remove(index)
    this.doc.activeIndex = index - 1
    const after = this.doc.structure()

    this.history.push({
      kind: 'compound',
      steps: [pixels, { kind: 'layers', before, after, bytes: 0 }],
      bytes: pixels.bytes + this.layerBytes(),
    })
    this.notifyLayers()
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
   * Lifts the selected pixels of the active layer so they can be moved.
   * Without `fill` it is a copy and the original stays; with it the hole is
   * filled with that colour ('transparent' leaves it empty).
   */
  lift(fill: string | null): boolean {
    if (this.stroke || this.float || !this.selectionRect) return false
    const sel = this.selectionRect
    const layer = this.doc.active
    this.takeSnapshot()
    const canvas = this.copyArea(sel)
    if (fill) this.fillRect(layer.ctx, sel, fill)
    this.float = { layer, canvas, x: sel.x, y: sel.y, source: fill ? sel : null }
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

  /** Floats a pasted picture over the active layer at a point. */
  pasteFloating(picture: CanvasImageSource, width: number, height: number, at: Point): void {
    this.cancelStroke()
    this.settle()
    this.takeSnapshot()
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    canvas.getContext('2d')!.drawImage(picture, 0, 0, width, height)
    this.float = {
      layer: this.doc.active,
      canvas,
      x: Math.round(at.x),
      y: Math.round(at.y),
      source: null,
    }
    this.notifySelection()
    this.requestRender()
  }

  /** Puts floating pixels down: one undo step covers the lift and the move. */
  commitFloating(): void {
    const f = this.float
    if (!f) return
    this.float = null
    const dest = { x: f.x, y: f.y, width: f.canvas.width, height: f.canvas.height }
    f.layer.ctx.globalCompositeOperation = 'source-over'
    f.layer.ctx.globalAlpha = 1
    f.layer.ctx.drawImage(f.canvas, f.x, f.y)
    this.selectionRect = this.clip(dest)
    const area = this.clip(f.source ? unionRect(f.source, dest) : dest)
    if (area) this.record(area, f.layer)
    this.notifySelection()
    this.requestRender()
  }

  /** Drops floating pixels and restores what was under them. */
  cancelFloating(): void {
    const f = this.float
    if (!f) return
    this.float = null
    if (f.source) this.restore(f.source, f.layer)
    this.selectionRect = f.source
    this.notifySelection()
    this.requestRender()
  }

  /** Clears the selected pixels to a colour ('transparent' empties them), as one undo step. */
  deleteSelection(fill: string): void {
    const f = this.float
    if (f) {
      // The hole is already there; just forget the lifted pixels.
      this.float = null
      this.selectionRect = null
      if (f.source) this.record(f.source, f.layer)
      this.notifySelection()
      this.requestRender()
      return
    }
    const sel = this.selectionRect
    if (!sel) return
    this.edit((ctx) => {
      this.fillRect(ctx, sel, fill)
      return sel
    })
    this.selectionRect = null
    this.notifySelection()
  }

  /** Cuts every layer down to the selection, as one undo step. */
  crop(): boolean {
    this.settle()
    const sel = this.selectionRect
    if (!sel) return false
    return this.replaceDocument(() =>
      this.doc.resize(sel.width, sel.height, (ctx, old) => ctx.drawImage(old, -sel.x, -sel.y)),
    )
  }

  /** The selected pixels of the active layer (or all of it) as a new canvas, for copying. */
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

  /** Called when the selection or the floating pixels change. */
  onSelectionChange(listener: Listener): () => void {
    this.selectionListeners.add(listener)
    return () => this.selectionListeners.delete(listener)
  }

  /** Called when layers are added, removed, reordered, renamed or re-set. */
  onLayersChange(listener: Listener): () => void {
    this.layerListeners.add(listener)
    return () => this.layerListeners.delete(listener)
  }

  protected requestRender(): void {
    for (const listener of this.renderListeners) listener()
  }

  // --- Internals -------------------------------------------------------------

  private notifySelection(): void {
    for (const listener of this.selectionListeners) listener()
  }

  private notifySize(): void {
    for (const listener of this.sizeListeners) listener()
  }

  private notifyLayers(): void {
    for (const listener of this.layerListeners) listener()
  }

  private notifyHistory(): void {
    for (const listener of this.historyListeners) listener()
  }

  /** Memory of one full-size layer, for the history budget. */
  private layerBytes(): number {
    return this.doc.width * this.doc.height * 4
  }

  private fillRect(ctx: CanvasRenderingContext2D, rect: Rect, fill: string): void {
    ctx.globalCompositeOperation = 'source-over'
    ctx.globalAlpha = 1
    ctx.clearRect(rect.x, rect.y, rect.width, rect.height)
    if (fill === 'transparent') return
    ctx.fillStyle = fill
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height)
  }

  /** Removes all layers and starts one new one of a new size. */
  private startOver(width: number, height: number, name: string): Layer {
    this.doc.width = width
    this.doc.height = height
    const layer = this.doc.createLayer(name)
    this.doc.layers = [layer]
    this.doc.activeIndex = 0
    return layer
  }

  /** Runs a layer-list change as one undo step. */
  private changeStructure(mutate: () => void, bytes = 0): boolean {
    if (this.stroke) return false
    this.settle()
    const before = this.doc.structure()
    mutate()
    const after = this.doc.structure()
    this.history.push({ kind: 'layers', before, after, bytes })
    this.notifyLayers()
    this.notifyHistory()
    this.requestRender()
    return true
  }

  /** Every layer's pixels and the layer list, for whole-document steps. */
  private captureDocument(): DocState {
    this.matchSnapshot()
    return {
      width: this.doc.width,
      height: this.doc.height,
      structure: this.doc.structure(),
      images: this.doc.layers.map((layer) => {
        this.takeSnapshot(layer)
        return {
          layer,
          image: this.snapshotCtx.getImageData(0, 0, this.doc.width, this.doc.height),
        }
      }),
    }
  }

  /** Runs a change that may touch every layer and the size, as one undo step. */
  private replaceDocument(change: () => void): boolean {
    if (this.stroke) return false
    this.settle()
    this.selectionRect = null
    this.notifySelection()
    const before = this.captureDocument()
    change()
    const after = this.captureDocument()
    const bytes = [...before.images, ...after.images].reduce(
      (sum, { image }) => sum + image.data.byteLength,
      0,
    )
    this.history.push({ kind: 'document', before, after, bytes })
    this.notifySize()
    this.notifyLayers()
    this.notifyHistory()
    this.requestRender()
    return true
  }

  private apply(patch: Patch, side: 'before' | 'after'): void {
    switch (patch.kind) {
      case 'pixels':
        patch.layer.ctx.putImageData(patch[side], patch.rect.x, patch.rect.y)
        return
      case 'layers':
        this.doc.setStructure(patch[side])
        this.notifyLayers()
        return
      case 'compound': {
        const steps = side === 'after' ? patch.steps : [...patch.steps].reverse()
        for (const step of steps) this.apply(step, side)
        return
      }
      case 'document': {
        const state = patch[side]
        this.doc.width = state.width
        this.doc.height = state.height
        for (const { layer, image } of state.images) {
          layer.canvas.width = state.width
          layer.canvas.height = state.height
          layer.ctx.putImageData(image, 0, 0)
        }
        this.doc.setStructure(state.structure)
        this.matchSnapshot()
        this.selectionRect = null
        this.notifySelection()
        this.notifySize()
        this.notifyLayers()
      }
    }
  }

  private copyArea(rect: Rect): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    canvas.width = rect.width
    canvas.height = rect.height
    canvas
      .getContext('2d')!
      .drawImage(
        this.doc.active.canvas,
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

  /** The snapshot always has the document's size. */
  private matchSnapshot(): void {
    if (this.snapshot.width === this.doc.width && this.snapshot.height === this.doc.height) return
    this.snapshot.width = this.doc.width
    this.snapshot.height = this.doc.height
  }

  private clip(rect: Rect | null): Rect | null {
    return rect && clampRect(rect, this.doc.width, this.doc.height)
  }

  private takeSnapshot(layer: Layer = this.doc.active): void {
    this.matchSnapshot()
    this.snapshotCtx.clearRect(0, 0, this.snapshot.width, this.snapshot.height)
    this.snapshotCtx.drawImage(layer.canvas, 0, 0)
  }

  /** Copies an area back from the snapshot onto a layer. */
  private restore(rect: Rect, layer: Layer = this.doc.active): void {
    const area = this.clip(rect)
    if (!area) return
    const { x, y, width, height } = area
    layer.ctx.clearRect(x, y, width, height)
    layer.ctx.drawImage(this.snapshot, x, y, width, height, x, y, width, height)
  }

  /** An area of a layer before (from the snapshot) and after (from the layer). */
  private capture(layer: Layer, area: Rect): Patch & { kind: 'pixels' } {
    const { x, y, width, height } = area
    const before = this.snapshotCtx.getImageData(x, y, width, height)
    // Read the result through the snapshot too: layer canvases stay on the
    // GPU for fast drawing, and the snapshot is refreshed before each change.
    this.snapshotCtx.clearRect(x, y, width, height)
    this.snapshotCtx.drawImage(layer.canvas, x, y, width, height, x, y, width, height)
    const after = this.snapshotCtx.getImageData(x, y, width, height)
    return {
      kind: 'pixels',
      layer,
      rect: area,
      before,
      after,
      bytes: before.data.byteLength + after.data.byteLength,
    }
  }

  private record(area: Rect, layer: Layer = this.doc.active): void {
    this.history.push(this.capture(layer, area))
    this.notifyHistory()
  }

  private track(rect: Rect | null): void {
    if (!rect) return
    this.strokeArea = unionRect(this.strokeArea, rect)
    this.requestRender()
  }
}
