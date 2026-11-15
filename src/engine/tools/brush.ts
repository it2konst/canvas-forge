import { midpoint, rectAround, unionRect, type Point, type Rect } from '../geometry'
import type { StrokePoint } from '../input'
import type { StrokeFactory } from './types'

/** How quickly the width follows pen pressure (0..1); lower is smoother. */
const PRESSURE_SMOOTHING = 0.35
/** Pointer moves shorter than this (image px) are merged into the next one. */
const MIN_STEP = 0.75
const MIN_WIDTH = 0.5

/** Area covered by a curve segment drawn with the given line width. */
function segmentArea(points: readonly Point[], width: number): Rect {
  let area: Rect | null = null
  for (const p of points) area = unionRect(area, rectAround(p, width / 2 + 1))
  return area!
}

/**
 * Round, anti-aliased brush. The path runs through the midpoints between
 * samples with the samples as quadratic control points, so fast strokes
 * curve smoothly instead of showing corners. Pen pressure sets the width.
 */
export const roundBrushStroke: StrokeFactory = (ctx, { color, size }) => {
  let last: StrokePoint | null = null
  let lastMid: Point | null = null
  let pressure = 1

  const widthFor = (p: number) => Math.max(MIN_WIDTH, size * p)

  function prepare(width: number) {
    ctx.globalCompositeOperation = 'source-over'
    ctx.globalAlpha = 1
    ctx.strokeStyle = color
    ctx.fillStyle = color
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = width
  }

  return {
    add(point) {
      if (!last || !lastMid) {
        // A click without moving leaves a round dot.
        pressure = point.pressure
        const width = widthFor(pressure)
        prepare(width)
        ctx.beginPath()
        ctx.arc(point.x, point.y, width / 2, 0, Math.PI * 2)
        ctx.fill()
        last = point
        lastMid = point
        return rectAround(point, width / 2 + 1)
      }

      if (Math.hypot(point.x - last.x, point.y - last.y) < MIN_STEP) return null

      pressure += (point.pressure - pressure) * PRESSURE_SMOOTHING
      const width = widthFor(pressure)
      const mid = midpoint(last, point)

      prepare(width)
      ctx.beginPath()
      ctx.moveTo(lastMid.x, lastMid.y)
      ctx.quadraticCurveTo(last.x, last.y, mid.x, mid.y)
      ctx.stroke()

      const area = segmentArea([lastMid, last, mid], width)
      last = point
      lastMid = mid
      return area
    },

    finish() {
      if (!last || !lastMid || (last.x === lastMid.x && last.y === lastMid.y)) return null
      // Close the gap between the last midpoint and the final sample.
      const width = widthFor(pressure)
      prepare(width)
      ctx.beginPath()
      ctx.moveTo(lastMid.x, lastMid.y)
      ctx.lineTo(last.x, last.y)
      ctx.stroke()
      return segmentArea([lastMid, last], width)
    },
  }
}
