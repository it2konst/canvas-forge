import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ToolId } from '@/tools/catalog'

export interface Point {
  x: number
  y: number
}

/** Editor state shared by the panels. The drawing engine plugs in here later. */
export const useEditorStore = defineStore('editor', () => {
  const activeTool = ref<ToolId>('brush')

  const primaryColor = ref('#000000')
  const secondaryColor = ref('#FFFFFF')
  const brushSize = ref(8)

  const canvasWidth = ref(1280)
  const canvasHeight = ref(800)
  const zoom = ref(1)

  /** Pointer position in image pixels, or null when the pointer is off the canvas. */
  const pointer = ref<Point | null>(null)

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
    pointer,
    swapColors,
  }
})
