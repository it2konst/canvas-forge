import { useEventListener } from '@vueuse/core'
import { TOOLS } from '@/tools/catalog'
import { useEditorStore } from '@/stores/editor'

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))

/** Single-key tool switching (B for brush, E for eraser…), ignored while typing. */
export function useToolShortcuts() {
  const editor = useEditorStore()

  useEventListener(window, 'keydown', (event: KeyboardEvent) => {
    if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return
    if (isTyping(event.target)) return

    const tool = TOOLS.find((t) => t.shortcut.toLowerCase() === event.key.toLowerCase())
    if (tool) {
      editor.activeTool = tool.id
      event.preventDefault()
    }
  })
}
