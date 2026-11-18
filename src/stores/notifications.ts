import { defineStore } from 'pinia'
import { ref } from 'vue'

export type NoticeKind = 'info' | 'error'

export interface Notice {
  id: number
  text: string
  kind: NoticeKind
}

/** Short messages at the bottom of the screen, one at a time. */
export const useNotificationsStore = defineStore('notifications', () => {
  const current = ref<Notice | null>(null)
  let next = 1

  function notify(text: string, kind: NoticeKind = 'info') {
    current.value = { id: next++, text, kind }
  }

  const dismiss = () => (current.value = null)

  return { current, notify, dismiss }
})
