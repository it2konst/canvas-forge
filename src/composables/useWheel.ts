import { useEventListener } from '@vueuse/core'
import type { Ref } from 'vue'
import { useViewStore } from '@/stores/view'

/** Wheel distance in pixels for one zoom of e (about 2.7x); a mouse notch is ~100 px. */
const ZOOM_SPEED = 0.0025
const LINE_HEIGHT = 40

/**
 * Wheel over the canvas:
 * - Ctrl + wheel (and trackpad pinch, which browsers report the same way)
 *   zooms around the pointer, so the spot under it stays put
 * - a plain wheel or two-finger trackpad swipe scrolls the view;
 *   Shift turns vertical wheel movement into horizontal
 */
export function useWheel(target: Readonly<Ref<HTMLElement | null>>) {
  const view = useViewStore()

  useEventListener(
    target,
    'wheel',
    (event: WheelEvent) => {
      // Not passive: the browser's own page zoom and scrolling must not happen.
      event.preventDefault()
      const scale = event.deltaMode === 1 ? LINE_HEIGHT : 1
      const dx = event.deltaX * scale
      const dy = event.deltaY * scale

      if (event.ctrlKey || event.metaKey) {
        const rect = target.value!.getBoundingClientRect()
        const delta = Math.max(-200, Math.min(200, dy))
        view.zoomBy(Math.exp(-delta * ZOOM_SPEED), {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        })
      } else if (event.shiftKey && !dx) {
        view.panBy(-dy, 0)
      } else {
        view.panBy(-dx, -dy)
      }
    },
    { passive: false },
  )
}
