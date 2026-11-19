import { onBeforeUnmount, watch, type Ref } from 'vue'
import { attachPointerInput, type PaintButton } from '@/engine/input'
import { sampleHex, type PixelBuffer } from '@/engine/pixels'
import type { Point } from '@/engine/geometry'
import { useEditorStore } from '@/stores/editor'
import { useViewStore } from '@/stores/view'
import { screenToImage } from '@/engine/view'
import { strokeFactoryFor } from '@/tools/painters'
import { rectFromPoints } from '@/engine/selection'

/** Connects pointer input on the visible canvas to the engine. */
export function useCanvasInput(canvas: Readonly<Ref<HTMLCanvasElement | null>>) {
  const editor = useEditorStore()
  const view = useViewStore()
  let detach: (() => void) | undefined

  /** While the colour picker is held down: the image to sample and the button. */
  let picking: { image: PixelBuffer; button: PaintButton } | null = null

  /** While the select tool is dragging: drawing a new area, or moving pixels. */
  let selecting:
    { mode: 'area'; start: Point } | { mode: 'move'; offsetX: number; offsetY: number } | null =
    null

  function beginSelect(point: Point & { ctrl?: boolean }) {
    const { engine } = editor
    const p = { x: Math.floor(point.x), y: Math.floor(point.y) }
    if (engine.isInSelection(p)) {
      if (point.ctrl) {
        // Ctrl + drag copies: put down what floats (a stamp) and lift a copy.
        engine.settle()
        engine.lift(null)
      } else if (!engine.floating) {
        engine.lift(editor.secondaryColor)
      }
      const sel = engine.selection!
      selecting = { mode: 'move', offsetX: p.x - sel.x, offsetY: p.y - sel.y }
      return
    }
    engine.select(null)
    selecting = { mode: 'area', start: point }
  }

  function moveSelect(point: Point) {
    if (!selecting) return
    if (selecting.mode === 'move') {
      editor.engine.moveFloating(
        Math.floor(point.x) - selecting.offsetX,
        Math.floor(point.y) - selecting.offsetY,
      )
    } else {
      const image = { width: editor.canvasWidth, height: editor.canvasHeight }
      editor.engine.select(rectFromPoints(selecting.start, point, image))
    }
  }

  function pick(point: Point) {
    if (!picking) return
    const color = sampleHex(picking.image, point.x, point.y)
    if (color) editor.setColor(picking.button, color)
  }

  // Screen pixels to image pixels; fractional, so strokes stay precise when zoomed out.
  function toImage(clientX: number, clientY: number) {
    const rect = canvas.value!.getBoundingClientRect()
    return screenToImage(view.view, { x: clientX - rect.left, y: clientY - rect.top })
  }

  const insideImage = (p: Point) =>
    p.x >= 0 && p.y >= 0 && p.x < editor.canvasWidth && p.y < editor.canvasHeight

  watch(
    canvas,
    (element) => {
      detach?.()
      detach = undefined
      if (!element) return
      detach = attachPointerInput(element, toImage, {
        begin(point, button) {
          if (editor.activeTool === 'select') {
            beginSelect(point)
            return
          }
          if (editor.activeTool === 'picker') {
            // One read of the image, then sampling while dragging is free.
            picking = { image: editor.engine.readImage(), button }
            pick(point)
            return
          }
          if (editor.activeTool === 'text') {
            // A click outside the open text box finishes it, like in Paint.
            if (editor.textDraft) void editor.commitText()
            else if (insideImage(point)) editor.openText(point, button)
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
          if (selecting) moveSelect(points.at(-1)!)
          else if (picking) pick(points.at(-1)!)
          else editor.engine.extendStroke(points)
        },
        end() {
          if (selecting) {
            selecting = null
            return
          }
          if (picking) {
            picking = null
            editor.activeTool = editor.previousTool
            return
          }
          editor.engine.endStroke()
        },
        hover(point) {
          editor.pointer =
            point && insideImage(point) ? { x: Math.floor(point.x), y: Math.floor(point.y) } : null
        },
      })
    },
    { immediate: true },
  )

  onBeforeUnmount(() => detach?.())
}
