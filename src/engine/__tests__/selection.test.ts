import { describe, expect, it } from 'vitest'
import { containsPoint, pastePosition, rectFromPoints } from '../selection'

const image = { width: 100, height: 50 }

describe('rectFromPoints', () => {
  it('includes both corner pixels in any drag direction', () => {
    const r = { x: 10, y: 5, width: 11, height: 6 }
    expect(rectFromPoints({ x: 10.7, y: 5.2 }, { x: 20.1, y: 10.9 }, image)).toEqual(r)
    expect(rectFromPoints({ x: 20.1, y: 10.9 }, { x: 10.7, y: 5.2 }, image)).toEqual(r)
  })

  it('selects a single pixel on a click', () => {
    expect(rectFromPoints({ x: 3, y: 3 }, { x: 3.5, y: 3.9 }, image)).toEqual({
      x: 3,
      y: 3,
      width: 1,
      height: 1,
    })
  })

  it('clips to the image when dragged past its edges', () => {
    expect(rectFromPoints({ x: -20, y: -5 }, { x: 500, y: 500 }, image)).toEqual({
      x: 0,
      y: 0,
      width: 100,
      height: 50,
    })
  })

  it('is empty when the drag stays outside the image', () => {
    expect(rectFromPoints({ x: -20, y: 10 }, { x: -5, y: 20 }, image)).toBeNull()
    expect(rectFromPoints({ x: 120, y: 10 }, { x: 150, y: 20 }, image)).toBeNull()
  })
})

describe('containsPoint', () => {
  const r = { x: 10, y: 10, width: 5, height: 5 }

  it('includes the top-left edge and excludes the bottom-right one', () => {
    expect(containsPoint(r, { x: 10, y: 10 })).toBe(true)
    expect(containsPoint(r, { x: 14, y: 14 })).toBe(true)
    expect(containsPoint(r, { x: 15, y: 14 })).toBe(false)
    expect(containsPoint(r, { x: 9, y: 12 })).toBe(false)
  })
})

describe('pastePosition', () => {
  it('uses the top-left of the visible part of the image', () => {
    expect(pastePosition({ x: 20.2, y: 7.5 }, image)).toEqual({ x: 21, y: 8 })
  })

  it('falls back to the image corner when the whole image is visible', () => {
    expect(pastePosition({ x: -300, y: -40 }, image)).toEqual({ x: 0, y: 0 })
  })

  it('stays inside the image', () => {
    expect(pastePosition({ x: 5000, y: 5000 }, image)).toEqual({ x: 99, y: 49 })
  })
})
