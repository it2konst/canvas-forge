import { useEventListener } from '@vueuse/core'
import { TOOLS } from '@/tools/catalog'
import { isToolReady } from '@/tools/painters'
import { useEditorStore } from '@/stores/editor'
import { useViewStore } from '@/stores/view'
import { useUiStore } from '@/stores/ui'

import { isTyping } from './keyboard'
import { useImageFiles } from './useImageFiles'

/**
 * Global keyboard shortcuts, ignored while typing in a field:
 * - single keys switch tools (B for brush, E for eraser...)
 * - Ctrl+Z undoes; Ctrl+Y and Ctrl+Shift+Z redo (Cmd on macOS)
 * - Escape drops the stroke in progress
 * - Ctrl+= / Ctrl+- zoom, Ctrl+0 fits the image, Ctrl+1 shows it at 100%
 * - Ctrl+E opens the image size dialog, Ctrl+O opens a file
 *
 * Keys are matched by their physical position (event.code), so shortcuts
 * work the same with a Russian or any other keyboard layout.
 */
export function useShortcuts() {
  const editor = useEditorStore()
  const view = useViewStore()
  const ui = useUiStore()
  const files = useImageFiles()

  useEventListener(window, 'keydown', (event: KeyboardEvent) => {
    if (isTyping(event.target)) return
    const code = event.code
    const mod = event.ctrlKey || event.metaKey

    if (code === 'Escape' && editor.engine.isStroking) {
      editor.engine.cancelStroke()
      return
    }

    if (mod && !event.altKey) {
      const action = (
        {
          KeyZ: () => (event.shiftKey ? editor.redo() : editor.undo()),
          KeyY: () => editor.redo(),
          Equal: () => view.zoomIn(),
          NumpadAdd: () => view.zoomIn(),
          Minus: () => view.zoomOut(),
          NumpadSubtract: () => view.zoomOut(),
          Digit0: () => view.fit(),
          Numpad0: () => view.fit(),
          Digit1: () => view.actualSize(),
          Numpad1: () => view.actualSize(),
          KeyE: () => (ui.imageSizeOpen = true),
          KeyO: () => files.pick(),
        } as Record<string, () => unknown>
      )[code]
      if (action) {
        // Also stops the browser's own page zoom.
        event.preventDefault()
        action()
      }
      return
    }

    if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return
    const tool = TOOLS.find((t) => `Key${t.shortcut}` === code)
    if (tool && isToolReady(tool.id)) {
      editor.activeTool = tool.id
      event.preventDefault()
    }
  })
}
