import { useEventListener } from '@vueuse/core'
import { TOOLS } from '@/tools/catalog'
import { isToolReady } from '@/tools/painters'
import { useEditorStore } from '@/stores/editor'

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))

/**
 * Global keyboard shortcuts, ignored while typing in a field:
 * - single keys switch tools (B for brush, E for eraser...)
 * - Ctrl+Z undoes; Ctrl+Y and Ctrl+Shift+Z redo (Cmd on macOS)
 * - Escape drops the stroke in progress
 */
export function useShortcuts() {
  const editor = useEditorStore()

  useEventListener(window, 'keydown', (event: KeyboardEvent) => {
    if (isTyping(event.target)) return
    const key = event.key.toLowerCase()
    const mod = event.ctrlKey || event.metaKey

    if (key === 'escape' && editor.engine.isStroking) {
      editor.engine.cancelStroke()
      return
    }

    if (mod && !event.altKey) {
      if (key === 'z' && !event.shiftKey) {
        event.preventDefault()
        editor.undo()
      } else if (key === 'y' || (key === 'z' && event.shiftKey)) {
        event.preventDefault()
        editor.redo()
      }
      return
    }

    if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return
    const tool = TOOLS.find((t) => t.shortcut.toLowerCase() === key)
    if (tool && isToolReady(tool.id)) {
      editor.activeTool = tool.id
      event.preventDefault()
    }
  })
}
