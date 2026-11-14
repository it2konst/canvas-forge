import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'

export type ThemeMode = 'light' | 'dark' | 'system'

export const THEME_MODES: readonly ThemeMode[] = ['light', 'dark', 'system']

const THEME_KEY = 'cf:theme'

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

  return { themeMode }
})
