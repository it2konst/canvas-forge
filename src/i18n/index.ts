import { createI18n } from 'vue-i18n'
import en from './locales/en'
import ru from './locales/ru'

/** English is the source of truth; other locales must match its shape. */
export type Messages = typeof en

export const LOCALES = ['en', 'ru'] as const
export type Locale = (typeof LOCALES)[number]

/** Names are shown in their own language so users can always find theirs. */
export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  ru: 'Русский',
}

export const isLocale = (value: unknown): value is Locale => LOCALES.includes(value as Locale)

const LOCALE_KEY = 'cf:locale'

/** Saved choice first, then the browser languages, then English. */
export function detectLocale(): Locale {
  try {
    const saved = localStorage.getItem(LOCALE_KEY)
    if (isLocale(saved)) return saved
  } catch {
    // Storage can be unavailable (private mode, blocked cookies).
  }
  const preferred = navigator.languages ?? [navigator.language]
  for (const tag of preferred) {
    const base = tag.toLowerCase().split('-')[0]
    if (isLocale(base)) return base
  }
  return 'en'
}

export const i18n = createI18n<[Messages], string, false>({
  legacy: false,
  locale: detectLocale(),
  fallbackLocale: 'en',
  messages: { en, ru },
})
