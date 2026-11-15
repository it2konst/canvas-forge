import type { Point } from './geometry'

export interface StrokePoint extends Point {
  /** 0..1. Mouse and touch report full pressure; only pens vary it. */
  pressure: number
}

/** Left button paints with colour 1, right button with colour 2, like in Paint. */
export type PaintButton = 'primary' | 'secondary'

export interface PointerInputHandlers {
  begin(point: StrokePoint, button: PaintButton): void
  move(points: StrokePoint[]): void
  end(): void
  /** Pointer position in image pixels, or null when it leaves the canvas. */
  hover(point: Point | null): void
}

const MIN_PEN_PRESSURE = 0.05

function pressureOf(event: PointerEvent): number {
  if (event.pointerType !== 'pen') return 1
  // Some pens report 0 for the first or last sample of a stroke.
  return Math.max(MIN_PEN_PRESSURE, event.pressure)
}

function buttonOf(event: PointerEvent): PaintButton | null {
  if (event.button === 0) return 'primary'
  if (event.button === 2) return 'secondary'
  return null
}

/**
 * Turns pointer events on an element into strokes in image coordinates.
 *
 * - One pointer at a time: a second finger or a mouse click during a pen
 *   stroke is ignored.
 * - Pointer capture keeps the stroke going when the pointer leaves the canvas.
 * - Coalesced events give every sample the hardware reported, so fast
 *   strokes stay smooth instead of turning into straight segments.
 */
export function attachPointerInput(
  element: HTMLElement,
  toImage: (clientX: number, clientY: number) => Point,
  handlers: PointerInputHandlers,
): () => void {
  let activePointer: number | null = null

  const toStrokePoint = (event: PointerEvent): StrokePoint => ({
    ...toImage(event.clientX, event.clientY),
    pressure: pressureOf(event),
  })

  function onDown(event: PointerEvent) {
    if (activePointer !== null) return
    const button = buttonOf(event)
    if (!button) return
    event.preventDefault()
    activePointer = event.pointerId
    try {
      element.setPointerCapture(event.pointerId)
    } catch {
      // The pointer may already be gone; the stroke still works without capture.
    }
    handlers.begin(toStrokePoint(event), button)
  }

  function onMove(event: PointerEvent) {
    handlers.hover(toImage(event.clientX, event.clientY))
    if (event.pointerId !== activePointer) return
    const samples = event.getCoalescedEvents?.() ?? []
    handlers.move((samples.length ? samples : [event]).map(toStrokePoint))
  }

  function onEnd(event: PointerEvent) {
    if (event.pointerId !== activePointer) return
    activePointer = null
    if (element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId)
    handlers.end()
  }

  const onLeave = () => handlers.hover(null)
  const onContextMenu = (event: Event) => event.preventDefault()

  const listeners: [string, EventListener][] = [
    ['pointerdown', onDown as EventListener],
    ['pointermove', onMove as EventListener],
    ['pointerup', onEnd as EventListener],
    ['pointercancel', onEnd as EventListener],
    ['lostpointercapture', onEnd as EventListener],
    ['pointerleave', onLeave],
    ['contextmenu', onContextMenu],
  ]
  for (const [type, listener] of listeners) element.addEventListener(type, listener)
  return () => {
    for (const [type, listener] of listeners) element.removeEventListener(type, listener)
  }
}
