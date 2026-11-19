import { useI18n } from 'vue-i18n'
import { encode } from '@/files/save'
import { useEditorStore } from '@/stores/editor'
import { useNotificationsStore } from '@/stores/notifications'
import { useImageFiles } from './useImageFiles'

/**
 * The app's own copy of the last copied pixels. Used when the system
 * clipboard refused to take the image (some browsers, insecure origins),
 * so copy and paste inside the editor still work.
 */
let internal: HTMLCanvasElement | null = null
let systemHasIt = false

/** Copy, cut and paste of image pixels through the system clipboard. */
export function useClipboard() {
  const editor = useEditorStore()
  const notifications = useNotificationsStore()
  const files = useImageFiles()
  const { t } = useI18n()

  /** Copies the selection, or the whole image when nothing is selected. */
  async function copy(): Promise<boolean> {
    await editor.commitText()
    const canvas = editor.engine.copySelection()
    internal = canvas
    systemHasIt = false
    try {
      // A promise inside ClipboardItem keeps Safari's user-gesture check happy.
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': encode(canvas, 'png', 1) }),
      ])
      systemHasIt = true
    } catch {
      // The pixels stay in the app's own clipboard.
    }
    notifications.notify(t(editor.selection ? 'clipboard.copied' : 'clipboard.copiedImage'))
    return true
  }

  /** Copies the selection and clears it to colour 2. */
  async function cut() {
    if (!editor.selection) return
    await copy()
    editor.engine.deleteSelection(editor.secondaryColor)
  }

  /** Pastes what the app copied itself, when the system clipboard has no image of ours. */
  async function pasteInternal(): Promise<boolean> {
    if (!internal || systemHasIt) return false
    await files.pastePicture(internal, internal.width, internal.height)
    return true
  }

  /**
   * Paste from a button: reads the system clipboard (the browser may ask for
   * permission), falling back to the app's own copy.
   */
  async function pasteFromButton() {
    try {
      for (const item of await navigator.clipboard.read()) {
        const type = item.types.find((ty) => ty.startsWith('image/'))
        if (!type) continue
        const blob = await item.getType(type)
        await files.paste(new File([blob], 'clipboard', { type }))
        return
      }
    } catch {
      // Reading may be blocked; try our own copy.
    }
    if (internal) {
      await files.pastePicture(internal, internal.width, internal.height)
      return
    }
    notifications.notify(t('clipboard.noImage'))
  }

  return { copy, cut, pasteInternal, pasteFromButton }
}
