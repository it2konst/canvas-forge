import { describe, expect, it } from 'vitest'
import { clampRect, forEachLinePixel, midpoint, rectAround, unionRect } from '../geometry'

function linePixels(x0: number, y0: number, x1: number, y1: number) {
  const pixels: [number, number][] = []
  forEachLinePixel(x0, y0, x1, y1, (x, y) => pixels.push([x, y]))
  return pixels
}

describe('rectAround', () => {
  it('covers a radius around a fractional point with whole pixels', () => {
    expect(rectAround({ x: 10.5, y: 4.2 }, 2)).toEqual({ x: 8, y: 2, width: 5, height: 5 })
  })
})

describe('unionRect', () => {
  it('returns a copy of the rect when there is nothing to merge with', () => {
    const r = { x: 1, y: 2, width: 3, height: 4 }
    const result = unionRect(null, r)
    expect(result).toEqual(r)
    expect(result).not.toBe(r)
  })

  it('covers both rects', () => {
    expect(
      unionRect({ x: 0, y: 0, width: 2, height: 2 }, { x: 5, y: -1, width: 1, height: 1 }),
    ).toEqual({ x: 0, y: -1, width: 6, height: 3 })
  })
})

describe('clampRect', () => {
  it('clips to the image', () => {
    expect(clampRect({ x: -5, y: 90, width: 20, height: 20 }, 100, 100)).toEqual({
      x: 0,
      y: 90,
      width: 15,
      height: 10,
    })
  })

  it('returns null when the rect is fully outside', () => {
    expect(clampRect({ x: 100, y: 0, width: 5, height: 5 }, 100, 100)).toBeNull()
    expect(clampRect({ x: -10, y: -10, width: 10, height: 10 }, 100, 100)).toBeNull()
  })
})

describe('midpoint', () => {
  it('is halfway between two points', () => {
    expect(midpoint({ x: 0, y: 0 }, { x: 3, y: -4 })).toEqual({ x: 1.5, y: -2 })
  })
})

describe('forEachLinePixel', () => {
  it('visits a single pixel for a zero-length line', () => {
    expect(linePixels(3, 3, 3, 3)).toEqual([[3, 3]])
  })

  it('includes both ends of horizontal, vertical and diagonal lines', () => {
    expect(linePixels(0, 0, 3, 0)).toEqual([
      [0, 0],
      [1, 0],
      [2, 0],
      [3, 0],
    ])
    expect(linePixels(0, 2, 0, 0)).toEqual([
      [0, 2],
      [0, 1],
      [0, 0],
    ])
    expect(linePixels(0, 0, -2, 2)).toEqual([
      [0, 0],
      [-1, 1],
      [-2, 2],
    ])
  })

  it('leaves no gaps: every step moves at most one pixel on each axis', () => {
    const pixels = linePixels(-7, 3, 25, -11)
    expect(pixels.at(0)).toEqual([-7, 3])
    expect(pixels.at(-1)).toEqual([25, -11])
    // A line is as long as its longer axis, plus the starting pixel.
    expect(pixels).toHaveLength(33)
    for (let i = 1; i < pixels.length; i++) {
      const [ax, ay] = pixels[i - 1]!
      const [bx, by] = pixels[i]!
      expect(Math.abs(bx - ax)).toBeLessThanOrEqual(1)
      expect(Math.abs(by - ay)).toBeLessThanOrEqual(1)
    }
  })
})
