import { ru as vuetifyRu } from 'vuetify/locale'
import type { Messages } from '../index'

export default {
  $vuetify: vuetifyRu,
  app: {
    name: 'canvas-forge',
    tagline: 'Графический редактор в духе Paint, который работает прямо в браузере',
  },
  theme: {
    label: 'Тема',
    light: 'Светлая',
    dark: 'Тёмная',
    system: 'Системная',
  },
  language: {
    label: 'Язык',
  },
} satisfies Messages
