import { moveItem } from './layers'

export const DEFAULT_BACKGROUND = '#FFFFFF'

/** One layer: a full-size canvas plus how it is shown. */
export interface Layer {
  readonly id: number
  name: string
  visible: boolean
  /** 0..1 */
  opacity: number
  readonly canvas: HTMLCanvasElement
  readonly ctx: CanvasRenderingContext2D
}

/**
 * The layer list without pixels: which layers, in which order, with which
 * names and settings, and which one is active. Undo of add, delete, reorder
 * and settings changes restores one of these; the layer objects themselves
 * (and their pixels) stay alive in history, so nothing is copied.
 */
export interface Structure {
  layers: { layer: Layer; name: string; visible: boolean; opacity: number }[]
  activeId: number
}

function makeCanvas(
  width: number,
  height: number,
): {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
} {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D is not supported')
  return { canvas, ctx }
}

/**
 * The image being edited: a stack of full-size off-screen canvases, bottom
 * first. It knows nothing about the screen; the viewport draws it scaled.
 */
export class RasterDocument {
  layers: Layer[] = []
  activeIndex = 0
  private nextId = 1

  constructor(
    public width: number,
    public height: number,
    background: string | null = DEFAULT_BACKGROUND,
    name = 'Background',
  ) {
    const layer = this.createLayer(name)
    if (background) {
      layer.ctx.fillStyle = background
      layer.ctx.fillRect(0, 0, width, height)
    }
    this.layers = [layer]
  }

  get active(): Layer {
    return this.layers[this.activeIndex]!
  }

  /** A new transparent layer of the document's size, not yet in the stack. */
  createLayer(name: string): Layer {
    const { canvas, ctx } = makeCanvas(this.width, this.height)
    return { id: this.nextId++, name, visible: true, opacity: 1, canvas, ctx }
  }

  indexOf(id: number): number {
    return this.layers.findIndex((l) => l.id === id)
  }

  structure(): Structure {
    return {
      layers: this.layers.map((layer) => ({
        layer,
        name: layer.name,
        visible: layer.visible,
        opacity: layer.opacity,
      })),
      activeId: this.active.id,
    }
  }

  setStructure(s: Structure): void {
    this.layers = s.layers.map(({ layer, name, visible, opacity }) => {
      layer.name = name
      layer.visible = visible
      layer.opacity = opacity
      return layer
    })
    this.activeIndex = Math.max(0, this.indexOf(s.activeId))
  }

  insert(layer: Layer, index: number): void {
    this.layers.splice(index, 0, layer)
    this.activeIndex = index
  }

  remove(index: number): void {
    this.layers.splice(index, 1)
    this.activeIndex = Math.min(this.activeIndex, this.layers.length - 1)
  }

  move(from: number, to: number): void {
    const active = this.active
    this.layers = moveItem(this.layers, from, to)
    this.activeIndex = this.layers.indexOf(active)
  }

  /**
   * Gives every layer a new size. Resizing clears a canvas, so `redraw` gets
   * a copy of each old layer to put back however it likes.
   */
  resize(
    width: number,
    height: number,
    redraw: (ctx: CanvasRenderingContext2D, old: HTMLCanvasElement, index: number) => void,
  ): void {
    const olds = this.layers.map((layer) => {
      const { canvas, ctx } = makeCanvas(this.width, this.height)
      ctx.drawImage(layer.canvas, 0, 0)
      return canvas
    })
    this.width = width
    this.height = height
    this.layers.forEach((layer, i) => {
      layer.canvas.width = width
      layer.canvas.height = height
      redraw(layer.ctx, olds[i]!, i)
    })
  }

  /** Draws the visible layers, bottom first, with their opacity. */
  drawComposite(ctx: CanvasRenderingContext2D): void {
    for (const layer of this.layers) {
      if (!layer.visible || layer.opacity <= 0) continue
      ctx.globalAlpha = layer.opacity
      ctx.drawImage(layer.canvas, 0, 0)
    }
    ctx.globalAlpha = 1
  }

  /** The picture as it looks: all visible layers flattened onto one canvas. */
  composite(): HTMLCanvasElement {
    const { canvas, ctx } = makeCanvas(this.width, this.height)
    this.drawComposite(ctx)
    return canvas
  }
}
