import { useI18n } from 'vue-i18n'
import { LoadError, OPEN_ACCEPT, loadPicture, type LoadedPicture } from '@/files/load'
import { MAX_SIDE } from '@/engine/resize'
import { useEditorStore } from '@/stores/editor'
import { useNotificationsStore } from '@/stores/notifications'
import { useViewStore } from '@/stores/view'

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
    if (editor.engine.openImage(loaded.picture, loaded.width, loaded.height)) {
      editor.fileName = loaded.name
      view.fit()
    }
    loaded.release()
  }

  /** Pastes at the top-left corner, growing the canvas if needed. */
  async function paste(file: File) {
    const loaded = await load(file)
    if (!loaded) return
    await editor.commitText()
    const grows = loaded.width > editor.canvasWidth || loaded.height > editor.canvasHeight
    editor.engine.paste(loaded.picture, loaded.width, loaded.height, editor.secondaryColor)
    if (grows) {
      notifications.notify(
        t('files.pasteGrew', { width: editor.canvasWidth, height: editor.canvasHeight }),
      )
    }
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

  return { open, paste, pick }
}
