import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg'
import { darkTheme, lightTheme } from '@/theme/themes'
import { readStoredThemeMode } from '@/stores/preferences'

export const vuetify = createVuetify({
  theme: {
    defaultTheme: readStoredThemeMode(),
    themes: { light: lightTheme, dark: darkTheme },
  },
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi },
  },
  defaults: {
    VBtn: { variant: 'text' },
    VTooltip: { openDelay: 400, location: 'bottom' },
  },
})
