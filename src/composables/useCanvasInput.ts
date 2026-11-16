import { onBeforeUnmount, watch, type Ref } from 'vue'
import { attachPointerInput } from '@/engine/input'
import { useEditorStore } from '@/stores/editor'
import { strokeFactoryFor } from '@/tools/painters'

/** Connects pointer input on the visible canvas to the engine. */
export function useCanvasInput(canvas: Readonly<Ref<HTMLCanvasElement | null>>) {
  const editor = useEditorStore()
  let detach: (() => void) | undefined

  // Screen pixels to image pixels; fractional, so strokes stay precise when zoomed out.
  function toImage(clientX: number, clientY: number) {
    const rect = canvas.value!.getBoundingClientRect()
    return {
      x: ((clientX - rect.left) / rect.width) * editor.canvasWidth,
      y: ((clientY - rect.top) / rect.height) * editor.canvasHeight,
    }
  }

  watch(
    canvas,
    (element) => {
      detach?.()
      detach = undefined
      if (!element) return
      detach = attachPointerInput(element, toImage, {
        begin(point, button) {
          if (editor.activeTool === 'fill') {
            editor.fillAt(point, button)
            return
          }
          const tool = strokeFactoryFor(editor.activeTool)
          if (!tool) return
          editor.engine.beginStroke(tool, editor.strokeSettings(button), point)
        },
        move: (points) => editor.engine.extendStroke(points),
        end: () => editor.engine.endStroke(),
        hover(point) {
          editor.pointer = point && { x: Math.floor(point.x), y: Math.floor(point.y) }
        },
      })
    },
    { immediate: true },
  )

  onBeforeUnmount(() => detach?.())
}
