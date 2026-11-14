import { watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { LOCALE_NAMES, LOCALES } from '@/i18n'
import { usePreferencesStore } from '@/stores/preferences'

export function useLocale() {
  const { locale } = storeToRefs(usePreferencesStore())
  return { locale, locales: LOCALES, names: LOCALE_NAMES }
}

/** Applies the saved language to vue-i18n, `<html lang>` and the page title. Call once, in App.vue. */
export function useLocaleSync() {
  const { locale } = useLocale()
  const i18n = useI18n()

  watch(
    locale,
    (value) => {
      i18n.locale.value = value
      document.documentElement.lang = value
      document.title = `${i18n.t('app.name')} — ${i18n.t('app.tagline')}`
    },
    { immediate: true },
  )
}
