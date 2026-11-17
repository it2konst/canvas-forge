import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import type { Point } from '@/engine/geometry'
import { clampView, fitView, stepZoom, zoomAround, type Size, type View } from '@/engine/view'
import { useEditorStore } from './editor'

/** Space around the image when it is fitted to the screen. */
const FIT_PADDING = { phone: 12, desktop: 32 }

/** Zoom and pan of the canvas area. */
export const useViewStore = defineStore('view', () => {
  const editor = useEditorStore()

  const view = ref<View>({ zoom: 1, x: 0, y: 0 })
  const viewport = ref<Size>({ width: 0, height: 0 })
  /** While true the image follows the window size; any zoom or pan turns it off. */
  const fitting = ref(true)
  /** Space is held: any tool pans, like the hand. */
  const spaceHeld = ref(false)
  /** A pan drag is in progress. */
  const dragging = ref(false)

  const zoom = computed(() => view.value.zoom)
  const image = computed<Size>(() => ({ width: editor.canvasWidth, height: editor.canvasHeight }))
  const centre = computed<Point>(() => ({
    x: viewport.value.width / 2,
    y: viewport.value.height / 2,
  }))

  function set(next: View) {
    view.value = clampView(next, image.value, viewport.value)
  }

  function fit() {
    fitting.value = true
    const padding = viewport.value.width < 600 ? FIT_PADDING.phone : FIT_PADDING.desktop
    view.value = fitView(image.value, viewport.value, padding)
  }

  function setViewport(size: Size) {
    const old = viewport.value
    viewport.value = size
    if (fitting.value || !old.width) {
      fit()
    } else {
      // Keep the same image point in the middle when the window changes size.
      set({
        ...view.value,
        x: view.value.x + (size.width - old.width) / 2,
        y: view.value.y + (size.height - old.height) / 2,
      })
    }
  }

  function zoomTo(zoom: number, anchor: Point = centre.value) {
    fitting.value = false
    set(zoomAround(view.value, zoom, anchor))
  }

  // A new image size (resize, open) refits or at least keeps the image in view.
  watch(image, () => (fitting.value ? fit() : set(view.value)))

  const zoomBy = (factor: number, anchor?: Point) => zoomTo(view.value.zoom * factor, anchor)
  const zoomIn = (anchor?: Point) => zoomTo(stepZoom(view.value.zoom, 1), anchor)
  const zoomOut = (anchor?: Point) => zoomTo(stepZoom(view.value.zoom, -1), anchor)
  const actualSize = () => zoomTo(1)

  function setView(next: View) {
    fitting.value = false
    set(next)
  }

  function panBy(dx: number, dy: number) {
    fitting.value = false
    set({ ...view.value, x: view.value.x + dx, y: view.value.y + dy })
  }

  return {
    view,
    viewport,
    fitting,
    spaceHeld,
    dragging,
    zoom,
    setViewport,
    fit,
    zoomTo,
    zoomBy,
    zoomIn,
    zoomOut,
    actualSize,
    panBy,
    setView,
  }
})
