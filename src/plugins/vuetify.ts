import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg'
import { createVueI18nAdapter } from 'vuetify/locale/adapters/vue-i18n'
import { useI18n } from 'vue-i18n'
import { i18n } from '@/i18n'
import { darkTheme, lightTheme } from '@/theme/themes'
import { readStoredThemeMode } from '@/stores/preferences'

export const vuetify = createVuetify({
  locale: {
    // Vuetify's own strings (aria labels, pagination…) come from vue-i18n too.
    adapter: createVueI18nAdapter({ i18n, useI18n }),
  },
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
