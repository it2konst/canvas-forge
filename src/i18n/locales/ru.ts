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
  header: {
    file: 'Файл',
    new: 'Новое изображение',
    open: 'Открыть',
    save: 'Сохранить',
    undo: 'Отменить',
    redo: 'Повторить',
    source: 'Исходный код на GitHub',
  },
  panels: {
    tools: 'Инструменты',
    properties: 'Свойства',
    colors: 'Цвета',
    brush: 'Кисть',
    layers: 'Слои',
    comingSoon: 'Появится в одной из следующих версий.',
  },
  tools: {
    select: 'Выделение',
    hand: 'Рука',
    pencil: 'Карандаш',
    brush: 'Кисть',
    eraser: 'Ластик',
    fill: 'Заливка',
    picker: 'Пипетка',
    text: 'Текст',
    line: 'Линия',
    rectangle: 'Прямоугольник',
    ellipse: 'Эллипс',
    unavailable: '{tool}: появится позже',
  },
  colors: {
    primary: 'Цвет 1',
    secondary: 'Цвет 2',
    swap: 'Поменять цвета местами',
    palette: 'Палитра',
    hint: 'Клик выбирает цвет 1, правый клик выбирает цвет 2.',
  },
  brush: {
    size: 'Размер',
  },
  canvas: {
    label: 'Изображение',
  },
  status: {
    position: 'Курсор',
    size: 'Изображение',
    zoom: 'Масштаб',
  },
  language: {
    label: 'Язык',
  },
} satisfies Messages
