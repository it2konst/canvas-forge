import { computed, watch } from 'vue'
import { useTheme } from 'vuetify'
import { storeToRefs } from 'pinia'
import { mdiThemeLightDark, mdiWeatherNight, mdiWhiteBalanceSunny } from '@mdi/js'
import { THEME_MODES, usePreferencesStore, type ThemeMode } from '@/stores/preferences'

export const THEME_ICONS: Record<ThemeMode, string> = {
  light: mdiWhiteBalanceSunny,
  dark: mdiWeatherNight,
  system: mdiThemeLightDark,
}

/** Current theme mode with helpers to read and change it. */
export function useThemeMode() {
  const theme = useTheme()
  const { themeMode: mode } = storeToRefs(usePreferencesStore())

  const isDark = computed(() => theme.current.value.dark)
  const icon = computed(() => THEME_ICONS[mode.value])

  function cycle() {
    const next = THEME_MODES[(THEME_MODES.indexOf(mode.value) + 1) % THEME_MODES.length]
    mode.value = next ?? 'system'
  }

  return { mode, isDark, icon, cycle, modes: THEME_MODES }
}

/**
 * Keeps Vuetify, the native `color-scheme` (scrollbars, inputs, the colour
 * picker) and the browser `theme-color` in sync with the saved mode.
 * Call once, in App.vue.
 */
export function useThemeSync() {
  const theme = useTheme()
  const { mode } = useThemeMode()

  watch(mode, (value) => theme.change(value), { immediate: true })

  watch(
    () => theme.current.value,
    (current) => {
      document.documentElement.style.colorScheme = current.dark ? 'dark' : 'light'
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute('content', String(current.colors.surface))
    },
    { immediate: true },
  )
}
