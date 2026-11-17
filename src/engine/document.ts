import type { Rect } from './geometry'

export const DEFAULT_BACKGROUND = '#FFFFFF'

/**
 * The image being edited: one off-screen canvas at full resolution.
 * It knows nothing about the screen; the viewport draws it scaled.
 */
export class RasterDocument {
  readonly canvas: HTMLCanvasElement
  readonly ctx: CanvasRenderingContext2D

  constructor(
    public width: number,
    public height: number,
    background = DEFAULT_BACKGROUND,
  ) {
    this.canvas = document.createElement('canvas')
    this.canvas.width = width
    this.canvas.height = height
    const ctx = this.canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D is not supported')
    this.ctx = ctx
    ctx.fillStyle = background
    ctx.fillRect(0, 0, width, height)
  }

  /**
   * Gives the canvas a new size. Resizing clears a canvas, so `redraw`
   * gets a copy of the old picture to put back however it likes.
   */
  resize(
    width: number,
    height: number,
    redraw: (ctx: CanvasRenderingContext2D, old: HTMLCanvasElement) => void,
  ): void {
    const old = document.createElement('canvas')
    old.width = this.width
    old.height = this.height
    old.getContext('2d')!.drawImage(this.canvas, 0, 0)

    this.canvas.width = width
    this.canvas.height = height
    this.width = width
    this.height = height
    redraw(this.ctx, old)
  }

  /** Replaces the whole image, size included. */
  replace(image: ImageData): void {
    this.canvas.width = image.width
    this.canvas.height = image.height
    this.width = image.width
    this.height = image.height
    this.ctx.putImageData(image, 0, 0)
  }

  read(rect: Rect): ImageData {
    return this.ctx.getImageData(rect.x, rect.y, rect.width, rect.height)
  }

  write(image: ImageData, rect: Rect): void {
    this.ctx.putImageData(image, rect.x, rect.y)
  }
}
