import { ref } from 'vue'
import { useEventListener } from '@vueuse/core'
import { isImageFile } from '@/files/load'
import { isTyping } from './keyboard'
import { useImageFiles } from './useImageFiles'
import { useClipboard } from './useClipboard'

const hasFiles = (event: DragEvent) => event.dataTransfer?.types.includes('Files') ?? false

/**
 * Window-wide file input:
 * - dropping an image file anywhere opens it (an overlay shows while dragging)
 * - pasting an image (Ctrl+V) floats it over the canvas, ready to move
 */
export function useFileDropAndPaste() {
  const files = useImageFiles()
  const clipboard = useClipboard()
  const dragging = ref(false)
  // dragenter / dragleave fire for every child element; count them.
  let depth = 0

  useEventListener(window, 'dragenter', (event: DragEvent) => {
    if (!hasFiles(event)) return
    event.preventDefault()
    depth++
    dragging.value = true
  })

  useEventListener(window, 'dragover', (event: DragEvent) => {
    if (!hasFiles(event)) return
    // Without this the browser would open the file in the tab.
    event.preventDefault()
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'
  })

  useEventListener(window, 'dragleave', (event: DragEvent) => {
    if (!hasFiles(event)) return
    depth = Math.max(0, depth - 1)
    if (!depth) dragging.value = false
  })

  useEventListener(window, 'drop', (event: DragEvent) => {
    if (!hasFiles(event)) return
    event.preventDefault()
    depth = 0
    dragging.value = false
    const file = [...(event.dataTransfer?.files ?? [])].find(isImageFile)
    // Not an image: let open() explain why.
    const candidate = file ?? event.dataTransfer?.files[0]
    if (candidate) void files.open(candidate)
  })

  useEventListener(window, 'paste', (event: ClipboardEvent) => {
    if (isTyping(event.target)) return
    const item = [...(event.clipboardData?.items ?? [])].find(
      (i) => i.kind === 'file' && i.type.startsWith('image/'),
    )
    const file = item?.getAsFile()
    if (file) {
      event.preventDefault()
      void files.paste(file)
      return
    }
    // No image from the system: maybe it refused ours earlier.
    void clipboard.pasteInternal()
  })

  return { dragging }
}
