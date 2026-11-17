import { useEventListener } from '@vueuse/core'
import type { Ref } from 'vue'
import type { Point } from '@/engine/geometry'
import { clampZoom, screenToImage, type View } from '@/engine/view'
import { useEditorStore } from '@/stores/editor'
import { useViewStore } from '@/stores/view'

/**
 * Two fingers zoom and move the view together: the image point between
 * the fingers stays between them. A second finger cancels the stroke the
 * first one started, so pinching never leaves a mark.
 */
export function usePinch(target: Readonly<Ref<HTMLElement | null>>) {
  const editor = useEditorStore()
  const view = useViewStore()

  const touches = new Map<number, Point>()
  let gesture: { distance: number; anchor: Point; start: View } | null = null

  function local(event: PointerEvent): Point {
    const rect = target.value!.getBoundingClientRect()
    return { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }

  function measure(): { distance: number; mid: Point } {
    const [a, b] = [...touches.values()] as [Point, Point]
    return {
      distance: Math.max(1, Math.hypot(b.x - a.x, b.y - a.y)),
      mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
    }
  }

  useEventListener(
    target,
    'pointerdown',
    (event: PointerEvent) => {
      if (event.pointerType !== 'touch') return
      touches.set(event.pointerId, local(event))
      if (touches.size !== 2) return
      event.stopImmediatePropagation()
      editor.engine.cancelStroke()
      const { distance, mid } = measure()
      gesture = { distance, anchor: screenToImage(view.view, mid), start: { ...view.view } }
    },
    { capture: true },
  )

  useEventListener(
    target,
    'pointermove',
    (event: PointerEvent) => {
      if (!touches.has(event.pointerId)) return
      touches.set(event.pointerId, local(event))
      if (!gesture || touches.size < 2) return
      event.stopImmediatePropagation()
      const { distance, mid } = measure()
      const zoom = clampZoom((gesture.start.zoom * distance) / gesture.distance)
      view.setView({
        zoom,
        x: mid.x - gesture.anchor.x * zoom,
        y: mid.y - gesture.anchor.y * zoom,
      })
    },
    { capture: true },
  )

  const lift = (event: PointerEvent) => {
    if (!touches.delete(event.pointerId)) return
    if (gesture) event.stopImmediatePropagation()
    if (touches.size < 2) gesture = null
  }
  useEventListener(target, 'pointerup', lift, { capture: true })
  useEventListener(target, 'pointercancel', lift, { capture: true })
}
