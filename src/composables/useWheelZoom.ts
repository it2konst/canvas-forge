import { useEventListener } from '@vueuse/core'
import type { Ref } from 'vue'
import { useViewStore } from '@/stores/view'

/** Wheel distance in pixels for one zoom of e (about 2.7x); a mouse notch is ~100 px. */
const ZOOM_SPEED = 0.0025
const LINE_HEIGHT = 40

/**
 * Ctrl + wheel (and trackpad pinch, which browsers report the same way)
 * zooms around the pointer, so the spot under it stays put.
 */
export function useWheelZoom(target: Readonly<Ref<HTMLElement | null>>) {
  const view = useViewStore()

  useEventListener(
    target,
    'wheel',
    (event: WheelEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return
      event.preventDefault()
      const scale = event.deltaMode === 1 ? LINE_HEIGHT : 1
      const delta = Math.max(-200, Math.min(200, event.deltaY * scale))
      const rect = target.value!.getBoundingClientRect()
      view.zoomBy(Math.exp(-delta * ZOOM_SPEED), {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      })
    },
    // Not passive: the browser's own page zoom must be prevented.
    { passive: false },
  )
}
