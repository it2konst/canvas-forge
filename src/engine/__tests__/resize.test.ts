import { describe, expect, it } from 'vitest'
import { MAX_SIDE, anchorOffset, clampSide, keepAspect, smoothScaling } from '../resize'

describe('anchorOffset', () => {
  const from = { width: 100, height: 50 }

  it('places the old picture at the anchor when the canvas grows', () => {
    const to = { width: 200, height: 150 }
    expect(anchorOffset(from, to, { x: 0, y: 0 })).toEqual({ x: 0, y: 0 })
    expect(anchorOffset(from, to, { x: 0.5, y: 0.5 })).toEqual({ x: 50, y: 50 })
    expect(anchorOffset(from, to, { x: 1, y: 1 })).toEqual({ x: 100, y: 100 })
  })

  it('crops from the opposite side when the canvas shrinks', () => {
    const to = { width: 60, height: 50 }
    expect(anchorOffset(from, to, { x: 1, y: 0 })).toEqual({ x: -40, y: 0 })
    expect(anchorOffset(from, to, { x: 0.5, y: 0.5 })).toEqual({ x: -20, y: 0 })
  })
})

describe('keepAspect', () => {
  const from = { width: 1280, height: 800 }

  it('derives the other side from the typed one', () => {
    expect(keepAspect(from, 'width', 640)).toEqual({ width: 640, height: 400 })
    expect(keepAspect(from, 'height', 1000)).toEqual({ width: 1600, height: 1000 })
  })

  it('never goes below one pixel or above the limit', () => {
    expect(keepAspect(from, 'width', 1).height).toBe(1)
    expect(keepAspect(from, 'width', 100000).width).toBe(MAX_SIDE)
  })
})

describe('clampSide', () => {
  it('rounds and keeps sides within 1..MAX_SIDE', () => {
    expect(clampSide(10.6)).toBe(11)
    expect(clampSide(0)).toBe(1)
    expect(clampSide(Number.NaN)).toBe(1)
    expect(clampSide(MAX_SIDE + 1)).toBe(MAX_SIDE)
  })
})

describe('smoothScaling', () => {
  const from = { width: 32, height: 32 }

  it('keeps whole-number enlargements crisp for pixel art', () => {
    expect(smoothScaling(from, { width: 128, height: 64 })).toBe(false)
    expect(smoothScaling(from, from)).toBe(false)
  })

  it('smooths everything else', () => {
    expect(smoothScaling(from, { width: 48, height: 48 })).toBe(true)
    expect(smoothScaling(from, { width: 16, height: 16 })).toBe(true)
  })
})
