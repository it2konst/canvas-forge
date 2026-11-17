import { useEventListener } from '@vueuse/core'
import type { Ref } from 'vue'
import { useEditorStore } from '@/stores/editor'
import { useViewStore } from '@/stores/view'
import { isTyping } from './keyboard'

/**
 * Dragging the view around:
 * - with the hand tool (H)
 * - with any tool while Space is held, as in most editors
 * - with the middle mouse button
 *
 * Listens in the capture phase so a pan never also starts a stroke.
 */
export function usePanning(target: Readonly<Ref<HTMLElement | null>>) {
  const editor = useEditorStore()
  const view = useViewStore()
  let drag: { id: number; x: number; y: number } | null = null

  const wantsPan = (event: PointerEvent) =>
    event.button === 1 || (event.button === 0 && (editor.activeTool === 'hand' || view.spaceHeld))

  useEventListener(
    target,
    'pointerdown',
    (event: PointerEvent) => {
      if (drag || !wantsPan(event)) return
      event.preventDefault()
      event.stopImmediatePropagation()
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY }
      view.dragging = true
      try {
        target.value!.setPointerCapture(event.pointerId)
      } catch {
        // Panning still works without capture.
      }
    },
    { capture: true },
  )

  useEventListener(
    target,
    'pointermove',
    (event: PointerEvent) => {
      if (!drag || event.pointerId !== drag.id) return
      event.stopImmediatePropagation()
      view.panBy(event.clientX - drag.x, event.clientY - drag.y)
      drag.x = event.clientX
      drag.y = event.clientY
    },
    { capture: true },
  )

  const end = (event: PointerEvent) => {
    if (!drag || event.pointerId !== drag.id) return
    event.stopImmediatePropagation()
    drag = null
    view.dragging = false
  }
  useEventListener(target, 'pointerup', end, { capture: true })
  useEventListener(target, 'pointercancel', end, { capture: true })

  // Stops the middle-button autoscroll some systems start on mousedown.
  useEventListener(target, 'mousedown', (event: MouseEvent) => {
    if (event.button === 1) event.preventDefault()
  })

  useEventListener(window, 'keydown', (event: KeyboardEvent) => {
    if (event.code !== 'Space' || isTyping(event.target)) return
    // Space would otherwise press the focused button or scroll the page.
    event.preventDefault()
    view.spaceHeld = true
  })
  useEventListener(window, 'keyup', (event: KeyboardEvent) => {
    if (event.code === 'Space') view.spaceHeld = false
  })
  useEventListener(window, 'blur', () => (view.spaceHeld = false))
}
