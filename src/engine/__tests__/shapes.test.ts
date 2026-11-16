import { describe, expect, it } from 'vitest'
import { constrainEnd, pixelBox, shapeStroke, type ShapeSettings } from '../tools/shapes'
import type { Rect } from '../geometry'
import { asContext, createMockContext } from './mockContext'

const at = (x: number, y: number, shift = false) => ({ x, y, pressure: 1, shift })
const settings: ShapeSettings = { color: '#000', size: 3, style: 'outline', fillColor: '#fff' }

describe('constrainEnd', () => {
  const o = { x: 10, y: 10 }

  it('snaps lines to horizontal and vertical', () => {
    expect(constrainEnd('line', o, { x: 50, y: 14 })).toEqual({ x: 50, y: 10 })
    expect(constrainEnd('line', o, { x: 7, y: -30 })).toEqual({ x: 10, y: -30 })
  })

  it('snaps lines to exact diagonals in every direction', () => {
    expect(constrainEnd('line', o, { x: 30, y: 28 })).toEqual({ x: 29, y: 29 })
    expect(constrainEnd('line', o, { x: -10, y: 30 })).toEqual({ x: -10, y: 30 })
    expect(constrainEnd('line', o, { x: -11, y: -9 })).toEqual({ x: -10, y: -10 })
  })

  it('turns rectangles and ellipses into squares and circles', () => {
    expect(constrainEnd('rectangle', o, { x: 40, y: 20 })).toEqual({ x: 40, y: 40 })
    expect(constrainEnd('ellipse', o, { x: 0, y: 40 })).toEqual({ x: -20, y: 40 })
  })
})

describe('pixelBox', () => {
  it('spans both pixels in any drag direction', () => {
    expect(pixelBox({ x: 5, y: 8 }, { x: 2, y: 3 })).toEqual({ x: 2, y: 3, width: 4, height: 6 })
    expect(pixelBox({ x: 4, y: 4 }, { x: 4, y: 4 })).toEqual({ x: 4, y: 4, width: 1, height: 1 })
  })
})

describe('shapeStroke', () => {
  it('draws nothing on a click without dragging', () => {
    const mock = createMockContext()
    const stroke = shapeStroke('rectangle')(asContext(mock), settings, { restore: () => {} })
    expect(stroke.add(at(5, 5))).toBeNull()
    expect(stroke.finish()).toBeNull()
    expect(mock.calls).toHaveLength(0)
  })

  it('erases the previous preview and reports both frames', () => {
    const restored: Rect[] = []
    const mock = createMockContext()
    const stroke = shapeStroke('rectangle')(asContext(mock), settings, {
      restore: (r) => restored.push(r),
    })
    stroke.add(at(0, 0))
    const big = stroke.add(at(100, 50))!
    const small = stroke.add(at(10, 10))!

    expect(restored).toEqual([big])
    // The second report covers the larger first frame so it gets repainted.
    expect(small.width).toBeGreaterThanOrEqual(big.width)
    expect(small.height).toBeGreaterThanOrEqual(big.height)
  })

  it('applies Shift per sample', () => {
    const mock = createMockContext()
    const stroke = shapeStroke('ellipse')(asContext(mock), settings, { restore: () => {} })
    stroke.add(at(0, 0))
    const area = stroke.add(at(40, 10, true))!
    // A 41 x 41 circle box plus padding for the line width.
    expect(area.width).toBe(area.height)
  })
})
