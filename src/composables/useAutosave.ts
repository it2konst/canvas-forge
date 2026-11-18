import { onMounted } from 'vue'
import { useDebounceFn, useEventListener } from '@vueuse/core'
import { useI18n } from 'vue-i18n'
import { loadDraft, saveDraft } from '@/files/autosave'
import { encode } from '@/files/save'
import { useEditorStore } from '@/stores/editor'
import { useNotificationsStore } from '@/stores/notifications'
import { useViewStore } from '@/stores/view'

/** Quiet time after the last change before the image is written. */
const DELAY_MS = 1500

/**
 * Keeps the current image in the browser and brings it back on the next
 * visit. Writes after a pause in editing and right away when the tab is
 * hidden or closed, so a reload never loses more than a moment of work.
 */
export function useAutosave() {
  const editor = useEditorStore()
  const view = useViewStore()
  const notifications = useNotificationsStore()
  const { t } = useI18n()
  let dirty = false
  let reportedError = false

  async function save() {
    if (!dirty) return
    dirty = false
    editor.autosave = 'saving'
    try {
      const { doc } = editor.engine
      const image = await encode(doc.canvas, 'png', 1)
      await saveDraft({
        image,
        width: doc.width,
        height: doc.height,
        name: editor.fileName,
        savedAt: Date.now(),
      })
      editor.autosave = 'saved'
      editor.autosavedAt = Date.now()
    } catch {
      editor.autosave = 'error'
      if (!reportedError) {
        reportedError = true
        notifications.notify(t('autosave.failed'), 'error')
      }
    }
  }

  const later = useDebounceFn(save, DELAY_MS)

  editor.engine.onHistoryChange(() => {
    dirty = true
    void later()
  })

  useEventListener(document, 'visibilitychange', () => {
    if (document.visibilityState === 'hidden') void save()
  })
  useEventListener(window, 'pagehide', () => void save())

  onMounted(async () => {
    try {
      const draft = await loadDraft()
      // Something was already drawn or opened while loading: keep that.
      if (!draft || editor.canUndo) return
      const bitmap = await createImageBitmap(draft.image)
      editor.engine.reset(bitmap, draft.width, draft.height)
      bitmap.close()
      editor.fileName = draft.name
      editor.autosave = 'saved'
      editor.autosavedAt = draft.savedAt
      view.fit()
    } catch {
      // No storage (private mode) or a damaged draft: start with a blank sheet.
    }
  })
}
