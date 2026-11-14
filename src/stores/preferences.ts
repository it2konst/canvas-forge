import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'
import { detectLocale, isLocale, type Locale } from '@/i18n'

export type ThemeMode = 'light' | 'dark' | 'system'

export const THEME_MODES: readonly ThemeMode[] = ['light', 'dark', 'system']

const THEME_KEY = 'cf:theme'
const LOCALE_KEY = 'cf:locale'

const isThemeMode = (value: unknown): value is ThemeMode => THEME_MODES.includes(value as ThemeMode)

/** Reads the saved mode synchronously so Vuetify starts with it and nothing flashes. */
export function readStoredThemeMode(): ThemeMode {
  try {
    const raw = localStorage.getItem(THEME_KEY)
    return isThemeMode(raw) ? raw : 'system'
  } catch {
    return 'system'
  }
}

export const usePreferencesStore = defineStore('preferences', () => {
  const themeMode = useLocalStorage<ThemeMode>(THEME_KEY, 'system', {
    serializer: { read: (v) => (isThemeMode(v) ? v : 'system'), write: (v) => v },
  })

  // Not written until the user picks a language, so the browser
  // language keeps working for first-time visitors.
  const locale = useLocalStorage<Locale>(LOCALE_KEY, detectLocale(), {
    serializer: { read: (v) => (isLocale(v) ? v : detectLocale()), write: (v) => v },
    writeDefaults: false,
  })

  return { themeMode, locale }
})
