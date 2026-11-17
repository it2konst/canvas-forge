import { describe, expect, it } from 'vitest'
import {
  MAX_ZOOM,
  MIN_ZOOM,
  clampView,
  fitView,
  imageToScreen,
  screenToImage,
  stepZoom,
  zoomAround,
} from '../view'

const image = { width: 1280, height: 800 }
const port = { width: 1000, height: 700 }

describe('screen and image coordinates', () => {
  it('convert both ways', () => {
    const view = { zoom: 2, x: 100, y: -50 }
    const p = { x: 37.5, y: 12 }
    expect(screenToImage(view, imageToScreen(view, p))).toEqual(p)
    expect(imageToScreen(view, { x: 0, y: 0 })).toEqual({ x: 100, y: -50 })
  })
})

describe('fitView', () => {
  it('fits the whole image with padding and centres it', () => {
    const v = fitView(image, port, 20)
    expect(v.zoom).toBeCloseTo(960 / 1280)
    expect(image.width * v.zoom).toBeLessThanOrEqual(port.width - 40)
    expect(image.height * v.zoom).toBeLessThanOrEqual(port.height - 40)
    expect(v.x).toBe(Math.round((port.width - image.width * v.zoom) / 2))
  })

  it('never enlarges a small image past 100%', () => {
    expect(fitView({ width: 100, height: 50 }, port, 20).zoom).toBe(1)
  })

  it('survives an empty viewport', () => {
    expect(fitView(image, { width: 0, height: 0 }, 20).zoom).toBe(1)
  })
})

describe('zoomAround', () => {
  it('keeps the image point under the anchor in place', () => {
    const view = { zoom: 0.75, x: 40, y: 30 }
    const anchor = { x: 321, y: 123 }
    const before = screenToImage(view, anchor)
    const after = zoomAround(view, 4, anchor)
    expect(after.zoom).toBe(4)
    const moved = screenToImage(after, anchor)
    expect(moved.x).toBeCloseTo(before.x)
    expect(moved.y).toBeCloseTo(before.y)
  })

  it('clamps to the zoom limits', () => {
    const view = { zoom: 1, x: 0, y: 0 }
    expect(zoomAround(view, 1000, { x: 0, y: 0 }).zoom).toBe(MAX_ZOOM)
    expect(zoomAround(view, 0, { x: 0, y: 0 }).zoom).toBe(MIN_ZOOM)
  })
})

describe('stepZoom', () => {
  it('moves to the next preset from any zoom', () => {
    expect(stepZoom(1, 1)).toBe(1.5)
    expect(stepZoom(1, -1)).toBeCloseTo(2 / 3)
    expect(stepZoom(0.82, 1)).toBe(1)
    expect(stepZoom(0.82, -1)).toBeCloseTo(2 / 3)
  })

  it('stops at the limits', () => {
    expect(stepZoom(MAX_ZOOM, 1)).toBe(MAX_ZOOM)
    expect(stepZoom(MIN_ZOOM, -1)).toBe(MIN_ZOOM)
  })
})

describe('clampView', () => {
  it('leaves a view that shows the image alone', () => {
    const v = { zoom: 1, x: 10, y: 10 }
    expect(clampView(v, image, port)).toEqual(v)
  })

  it('keeps part of the image on screen however far it is dragged', () => {
    const far = clampView({ zoom: 1, x: 99999, y: -99999 }, image, port, 64)
    expect(far.x).toBe(port.width - 64)
    expect(far.y).toBe(64 - image.height)
  })

  it('keeps a tiny image fully reachable', () => {
    const v = clampView({ zoom: 1, x: -500, y: 5000 }, { width: 10, height: 10 }, port, 64)
    expect(v.x).toBe(0)
    expect(v.y).toBe(port.height - 10)
  })
})
