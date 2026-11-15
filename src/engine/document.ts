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
    readonly width: number,
    readonly height: number,
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

  read(rect: Rect): ImageData {
    return this.ctx.getImageData(rect.x, rect.y, rect.width, rect.height)
  }

  write(image: ImageData, rect: Rect): void {
    this.ctx.putImageData(image, rect.x, rect.y)
  }
}
