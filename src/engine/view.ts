import type { Point } from './geometry'

/**
 * How the image sits in the viewport: its scale and where its top-left
 * corner is, in CSS pixels relative to the viewport.
 */
export interface View {
  zoom: number
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

export const MIN_ZOOM = 1 / 32
export const MAX_ZOOM = 64

/** Steps for zoom in / out buttons and keys, like most editors. */
export const ZOOM_STEPS: readonly number[] = [
  1 / 32,
  1 / 16,
  1 / 8,
  1 / 6,
  1 / 4,
  1 / 3,
  1 / 2,
  2 / 3,
  1,
  1.5,
  2,
  3,
  4,
  6,
  8,
  12,
  16,
  24,
  32,
  48,
  64,
]

export const clampZoom = (zoom: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom))

export const screenToImage = (view: View, p: Point): Point => ({
  x: (p.x - view.x) / view.zoom,
  y: (p.y - view.y) / view.zoom,
})

export const imageToScreen = (view: View, p: Point): Point => ({
  x: p.x * view.zoom + view.x,
  y: p.y * view.zoom + view.y,
})

/** Centres the whole image with some padding, never enlarging past `maxZoom`. */
export function fitView(image: Size, viewport: Size, padding: number, maxZoom = 1): View {
  const w = viewport.width - padding * 2
  const h = viewport.height - padding * 2
  const zoom =
    w > 0 && h > 0
      ? clampZoom(Math.min(maxZoom, w / image.width, h / image.height))
      : Math.min(1, maxZoom)
  return centre(zoom, image, viewport)
}

function centre(zoom: number, image: Size, viewport: Size): View {
  return {
    zoom,
    x: Math.round((viewport.width - image.width * zoom) / 2),
    y: Math.round((viewport.height - image.height * zoom) / 2),
  }
}

/** Changes the zoom so the image point under `anchor` (screen) stays under it. */
export function zoomAround(view: View, zoom: number, anchor: Point): View {
  const next = clampZoom(zoom)
  const image = screenToImage(view, anchor)
  return { zoom: next, x: anchor.x - image.x * next, y: anchor.y - image.y * next }
}

/** The next preset step in a direction, starting from any zoom. */
export function stepZoom(zoom: number, direction: 1 | -1): number {
  const eps = 1e-6
  if (direction > 0) return ZOOM_STEPS.find((z) => z > zoom + eps) ?? MAX_ZOOM
  return [...ZOOM_STEPS].reverse().find((z) => z < zoom - eps) ?? MIN_ZOOM
}

/**
 * Keeps the image from being lost off-screen: at least `keep` pixels of it
 * (or all of it, if smaller) stay inside the viewport on each axis.
 */
export function clampView(view: View, image: Size, viewport: Size, keep = 64): View {
  const clampAxis = (pos: number, size: number, port: number) => {
    const k = Math.min(keep, size)
    return Math.min(port - k, Math.max(k - size, pos))
  }
  return {
    zoom: view.zoom,
    x: clampAxis(view.x, image.width * view.zoom, viewport.width),
    y: clampAxis(view.y, image.height * view.zoom, viewport.height),
  }
}
