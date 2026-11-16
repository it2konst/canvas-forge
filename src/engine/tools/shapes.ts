import { unionRect, type Point, type Rect } from '../geometry'
import type { StrokeFactory, StrokeSettings } from './types'

export type ShapeKind = 'line' | 'rectangle' | 'ellipse'

/** Outline in the stroke colour, filled with it, or outlined and filled with the other colour. */
export type ShapeStyle = 'outline' | 'fill' | 'both'

export interface ShapeSettings extends StrokeSettings {
  style: ShapeStyle
  /** Used by 'fill' and 'both'. */
  fillColor: string
}

const sign = (n: number) => (n < 0 ? -1 : 1)

/**
 * Where the shape ends while Shift is held: lines snap to multiples of 45°,
 * rectangles become squares and ellipses circles. Works in whole pixels.
 */
export function constrainEnd(kind: ShapeKind, start: Point, end: Point): Point {
  const dx = end.x - start.x
  const dy = end.y - start.y

  if (kind === 'line') {
    const octant = Math.round(Math.atan2(dy, dx) / (Math.PI / 4))
    if (octant % 2 === 0) {
      // 0°, 90°, 180°, 270°: keep the axis the pointer moved along most.
      return Math.abs(dx) >= Math.abs(dy) ? { x: end.x, y: start.y } : { x: start.x, y: end.y }
    }
    const d = Math.round((Math.abs(dx) + Math.abs(dy)) / 2)
    return { x: start.x + sign(dx) * d, y: start.y + sign(dy) * d }
  }

  const d = Math.max(Math.abs(dx), Math.abs(dy))
  return { x: start.x + sign(dx) * d, y: start.y + sign(dy) * d }
}

/** Whole-pixel box spanned by two pixels, both included. */
export function pixelBox(a: Point, b: Point): Rect {
  const x = Math.min(a.x, b.x)
  const y = Math.min(a.y, b.y)
  return { x, y, width: Math.abs(b.x - a.x) + 1, height: Math.abs(b.y - a.y) + 1 }
}

/**
 * Lines are drawn through pixel centres. With an odd width the centre sits
 * on .5 so edges land on whole pixels; with an even width it sits on the
 * pixel's top-left corner for the same reason.
 */
const align = (n: number, width: number) => (Math.round(width) % 2 === 1 ? n + 0.5 : n)

function prepare(ctx: CanvasRenderingContext2D, s: ShapeSettings) {
  ctx.globalCompositeOperation = 'source-over'
  ctx.globalAlpha = 1
  ctx.strokeStyle = s.color
  ctx.fillStyle = s.fillColor
  ctx.lineWidth = Math.max(1, Math.round(s.size))
  ctx.lineCap = 'round'
  ctx.lineJoin = 'miter'
}

function drawShape(
  ctx: CanvasRenderingContext2D,
  kind: ShapeKind,
  a: Point,
  b: Point,
  s: ShapeSettings,
): Rect {
  prepare(ctx, s)
  const w = ctx.lineWidth
  const box = pixelBox(a, b)
  const pad = Math.ceil(w / 2) + 1
  const area = {
    x: box.x - pad,
    y: box.y - pad,
    width: box.width + pad * 2,
    height: box.height + pad * 2,
  }

  if (kind === 'line') {
    ctx.beginPath()
    ctx.moveTo(align(a.x, w), align(a.y, w))
    ctx.lineTo(align(b.x, w), align(b.y, w))
    ctx.stroke()
    return area
  }

  const fill = s.style !== 'outline'
  const outline = s.style !== 'fill'

  ctx.beginPath()
  if (kind === 'rectangle') {
    if (fill) ctx.fillRect(box.x, box.y, box.width, box.height)
    if (outline) {
      const x0 = align(box.x, w)
      const y0 = align(box.y, w)
      ctx.strokeRect(
        x0,
        y0,
        align(box.x + box.width - 1, w) - x0,
        align(box.y + box.height - 1, w) - y0,
      )
    }
    return area
  }

  // Ellipse inscribed in the pixel box.
  const cx = box.x + box.width / 2
  const cy = box.y + box.height / 2
  if (fill) {
    ctx.ellipse(cx, cy, box.width / 2, box.height / 2, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  if (outline) {
    // The outline is centred on the edge, so pull it in to stay inside the box.
    const rx = Math.max(0.5, (box.width - w) / 2)
    const ry = Math.max(0.5, (box.height - w) / 2)
    ctx.beginPath()
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
    ctx.stroke()
  }
  return area
}

/**
 * Drag to size the shape; it is redrawn on every move as a live preview
 * and stays when the pointer is released. A click without dragging draws
 * nothing, like in Paint.
 */
export function shapeStroke(kind: ShapeKind): StrokeFactory<ShapeSettings> {
  return (ctx, settings, env) => {
    let start: Point | null = null
    let drawn: Rect | null = null

    return {
      add(point) {
        const p = { x: Math.floor(point.x), y: Math.floor(point.y) }
        if (!start) {
          start = p
          return null
        }
        const end = point.shift ? constrainEnd(kind, start, p) : p
        const previous = drawn
        if (previous) env.restore(previous)
        drawn = drawShape(ctx, kind, start, end, settings)
        // Report the old preview too, so it is repainted after being erased.
        return previous ? unionRect(previous, drawn) : drawn
      },
      finish: () => null,
    }
  }
}
