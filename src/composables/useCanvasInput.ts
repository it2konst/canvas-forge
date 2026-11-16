import { onBeforeUnmount, watch, type Ref } from 'vue'
import { attachPointerInput, type PaintButton } from '@/engine/input'
import { sampleHex, type PixelBuffer } from '@/engine/pixels'
import type { Point } from '@/engine/geometry'
import { useEditorStore } from '@/stores/editor'
import { strokeFactoryFor } from '@/tools/painters'

/** Connects pointer input on the visible canvas to the engine. */
export function useCanvasInput(canvas: Readonly<Ref<HTMLCanvasElement | null>>) {
  const editor = useEditorStore()
  let detach: (() => void) | undefined

  /** While the colour picker is held down: the image to sample and the button. */
  let picking: { image: PixelBuffer; button: PaintButton } | null = null

  function pick(point: Point) {
    if (!picking) return
    const color = sampleHex(picking.image, point.x, point.y)
    if (color) editor.setColor(picking.button, color)
  }

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
          if (editor.activeTool === 'picker') {
            // One read of the image, then sampling while dragging is free.
            picking = { image: editor.engine.readImage(), button }
            pick(point)
            return
          }
          if (editor.activeTool === 'fill') {
            editor.fillAt(point, button)
            return
          }
          const tool = strokeFactoryFor(editor.activeTool)
          if (!tool) return
          editor.engine.beginStroke(tool, editor.strokeSettings(button), point)
        },
        move(points) {
          if (picking) pick(points.at(-1)!)
          else editor.engine.extendStroke(points)
        },
        end() {
          if (picking) {
            picking = null
            editor.activeTool = editor.previousTool
            return
          }
          editor.engine.endStroke()
        },
        hover(point) {
          editor.pointer = point && { x: Math.floor(point.x), y: Math.floor(point.y) }
        },
      })
    },
    { immediate: true },
  )

  onBeforeUnmount(() => detach?.())
}
