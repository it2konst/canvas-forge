import { useEventListener } from '@vueuse/core'
import { TOOLS } from '@/tools/catalog'
import { isToolReady } from '@/tools/painters'
import { useEditorStore } from '@/stores/editor'
import { useViewStore } from '@/stores/view'
import { useUiStore } from '@/stores/ui'

import { isTyping } from './keyboard'
import { useImageFiles } from './useImageFiles'
import { useClipboard } from './useClipboard'

/**
 * Global keyboard shortcuts, ignored while typing in a field:
 * - single keys switch tools (B for brush, E for eraser...)
 * - Ctrl+Z undoes; Ctrl+Y and Ctrl+Shift+Z redo (Cmd on macOS)
 * - Escape drops the stroke in progress
 * - Ctrl+= / Ctrl+- zoom, Ctrl+0 fits the image, Ctrl+1 shows it at 100%
 * - Ctrl+E opens the image size dialog, Ctrl+O opens a file,
 *   Ctrl+S saves, Ctrl+Alt+N starts a new image
 *
 * - selection: Ctrl+A, Ctrl+C, Ctrl+X, Ctrl+Shift+X crops, Delete clears,
 *   arrows nudge, Enter puts moved pixels down, Escape deselects
 *
 * Keys are matched by their physical position (event.code), so shortcuts
 * work the same with a Russian or any other keyboard layout.
 */
const ARROWS: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
}

export function useShortcuts() {
  const editor = useEditorStore()
  const view = useViewStore()
  const ui = useUiStore()
  const files = useImageFiles()
  const clipboard = useClipboard()

  useEventListener(window, 'keydown', (event: KeyboardEvent) => {
    if (isTyping(event.target)) return
    const code = event.code
    const mod = event.ctrlKey || event.metaKey

    if (code === 'Escape' && editor.engine.isStroking) {
      editor.engine.cancelStroke()
      return
    }
    // Escape or Enter put a moved selection down; Escape also deselects.
    if (code === 'Escape' && editor.selection) {
      editor.engine.select(null)
      return
    }
    if ((code === 'Enter' || code === 'NumpadEnter') && editor.floating) {
      // Otherwise Enter would also press whatever button has focus.
      event.preventDefault()
      editor.engine.settle()
      return
    }
    if ((code === 'Delete' || code === 'Backspace') && editor.selection) {
      event.preventDefault()
      editor.engine.deleteSelection(editor.secondaryColor)
      return
    }
    // Arrow keys nudge the selected pixels by 1 px, or 10 px with Shift.
    const nudge = ARROWS[code]
    if (nudge && editor.selection && editor.activeTool === 'select' && !mod) {
      event.preventDefault()
      const step = event.shiftKey ? 10 : 1
      if (!editor.floating) editor.engine.lift(editor.secondaryColor)
      const sel = editor.engine.selection!
      editor.engine.moveFloating(sel.x + nudge[0] * step, sel.y + nudge[1] * step)
      return
    }

    // Ctrl+N belongs to the browser; Ctrl+Alt+N is free.
    if (mod && event.altKey && code === 'KeyN') {
      event.preventDefault()
      ui.newImageOpen = true
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
          KeyS: () => (ui.saveOpen = true),
          // Ctrl+V needs no entry: the browser's paste event brings the data.
          KeyC: () => clipboard.copy(),
          KeyX: () => (event.shiftKey ? editor.engine.crop() : clipboard.cut()),
          KeyA: () => {
            editor.activeTool = 'select'
            editor.engine.selectAll()
          },
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
