import { defineStore } from 'pinia'
import { markRaw, ref } from 'vue'
import type { ToolId } from '@/tools/catalog'
import { Editor } from '@/engine/editor'
import type { Point } from '@/engine/geometry'
import type { PaintButton } from '@/engine/input'
import type { StrokeSettings } from '@/engine/tools/types'

/** Editor state shared by the panels, plus the drawing engine instance. */
export const useEditorStore = defineStore('editor', () => {
  const activeTool = ref<ToolId>('brush')

  const primaryColor = ref('#000000')
  const secondaryColor = ref('#FFFFFF')
  const brushSize = ref(8)

  const canvasWidth = ref(1280)
  const canvasHeight = ref(800)
  const zoom = ref(1)

  // markRaw: the engine owns canvases and must not be made reactive.
  const engine = markRaw(new Editor(canvasWidth.value, canvasHeight.value))

  const canUndo = ref(false)
  const canRedo = ref(false)
  engine.onHistoryChange(() => {
    canUndo.value = engine.canUndo
    canRedo.value = engine.canRedo
  })

  const undo = () => engine.undo()
  const redo = () => engine.redo()

  /** Pointer position in image pixels, or null when the pointer is off the canvas. */
  const pointer = ref<Point | null>(null)

  /**
   * Settings for a stroke with the active tool and the given mouse button.
   * Left paints with colour 1 and right with colour 2; the eraser swaps them,
   * so by default it paints with colour 2 (the background), like in Paint.
   */
  function strokeSettings(button: PaintButton): StrokeSettings {
    const usePrimary = (button === 'primary') !== (activeTool.value === 'eraser')
    return {
      color: usePrimary ? primaryColor.value : secondaryColor.value,
      size: brushSize.value,
    }
  }

  function swapColors() {
    ;[primaryColor.value, secondaryColor.value] = [secondaryColor.value, primaryColor.value]
  }

  return {
    activeTool,
    primaryColor,
    secondaryColor,
    brushSize,
    canvasWidth,
    canvasHeight,
    zoom,
    engine,
    canUndo,
    canRedo,
    undo,
    redo,
    pointer,
    strokeSettings,
    swapColors,
  }
})
