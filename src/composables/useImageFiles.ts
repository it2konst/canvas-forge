import { useI18n } from 'vue-i18n'
import { LoadError, OPEN_ACCEPT, loadPicture, type LoadedPicture } from '@/files/load'
import { MAX_SIDE } from '@/engine/resize'
import { useEditorStore } from '@/stores/editor'
import { useNotificationsStore } from '@/stores/notifications'
import { useViewStore } from '@/stores/view'
import { screenToImage } from '@/engine/view'
import { pastePosition } from '@/engine/selection'

/** Opening, pasting and dropping image files, with friendly errors. */
export function useImageFiles() {
  const editor = useEditorStore()
  const view = useViewStore()
  const notifications = useNotificationsStore()
  const { t } = useI18n()

  async function load(file: File): Promise<LoadedPicture | null> {
    try {
      const loaded = await loadPicture(file)
      if (loaded.scaled) {
        notifications.notify(
          t('files.scaledDown', { max: MAX_SIDE, width: loaded.width, height: loaded.height }),
        )
      }
      return loaded
    } catch (error) {
      const code = error instanceof LoadError ? error.code : 'decode'
      notifications.notify(t(`files.errors.${code}`, { name: file.name }), 'error')
      return null
    }
  }

  /** Replaces the image with the file; undo brings the previous one back. */
  async function open(file: File) {
    const loaded = await load(file)
    if (!loaded) return
    await editor.commitText()
    if (editor.engine.openImage(loaded.picture, loaded.width, loaded.height, loaded.name)) {
      editor.fileName = loaded.name
      view.fit()
    }
    loaded.release()
  }

  /**
   * Floats a picture over the image, at the top-left of what is on screen,
   * with the select tool active so it can be moved right away. A picture
   * larger than the canvas grows it first (colour 2 fills the new space),
   * like Paint does; that is its own undo step.
   */
  async function pastePicture(picture: CanvasImageSource, width: number, height: number) {
    await editor.commitText()
    let at = pastePosition(screenToImage(view.view, { x: 0, y: 0 }), {
      width: editor.canvasWidth,
      height: editor.canvasHeight,
    })
    if (width > editor.canvasWidth || height > editor.canvasHeight) {
      editor.engine.resize({
        kind: 'canvas',
        width: Math.max(width, editor.canvasWidth),
        height: Math.max(height, editor.canvasHeight),
        anchor: { x: 0, y: 0 },
        fill: editor.secondaryColor,
      })
      at = { x: 0, y: 0 }
      notifications.notify(
        t('files.pasteGrew', { width: editor.canvasWidth, height: editor.canvasHeight }),
      )
    }
    editor.activeTool = 'select'
    editor.engine.pasteFloating(picture, width, height, at)
  }

  async function paste(file: File) {
    const loaded = await load(file)
    if (!loaded) return
    await pastePicture(loaded.picture, loaded.width, loaded.height)
    loaded.release()
  }

  /** Shows the system file picker and opens the chosen image. */
  function pick() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = OPEN_ACCEPT
    input.addEventListener('change', () => {
      const file = input.files?.[0]
      if (file) void open(file)
    })
    input.click()
  }

  return { open, paste, pastePicture, pick }
}
