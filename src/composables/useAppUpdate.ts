import { useRegisterSW } from 'virtual:pwa-register/vue'
import { useI18n } from 'vue-i18n'
import { watch } from 'vue'
import { useNotificationsStore } from '@/stores/notifications'
import { flushAutosave } from './useAutosave'

/** How often an open tab asks the server whether a new version exists. */
const CHECK_EVERY_MS = 60 * 60 * 1000

/**
 * Registers the service worker that makes the editor work offline.
 * A new version is downloaded in the background but only takes over when
 * the user presses Update, so nobody loses work to a sudden reload.
 */
export function useAppUpdate() {
  const notifications = useNotificationsStore()
  const { t } = useI18n()

  const { needRefresh, offlineReady, updateServiceWorker } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return
      setInterval(() => {
        // Skip checks while offline or in a background tab.
        if (navigator.onLine && document.visibilityState === 'visible') {
          void registration.update()
        }
      }, CHECK_EVERY_MS)
    },
  })

  watch(offlineReady, (ready) => {
    if (ready) notifications.notify(t('pwa.offlineReady'))
  })

  /** Saves the image first, then lets the new version take over and reloads. */
  async function update() {
    await flushAutosave()
    // workbox-window reloads only when the page was controlled from the
    // start; reloading on any controller change covers a first visit too.
    navigator.serviceWorker?.addEventListener('controllerchange', () => location.reload(), {
      once: true,
    })
    await updateServiceWorker(true)
  }
  const later = () => (needRefresh.value = false)

  return { needRefresh, update, later }
}
