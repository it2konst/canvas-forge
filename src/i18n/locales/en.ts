import { en as vuetifyEn } from 'vuetify/locale'

export default {
  $vuetify: vuetifyEn,
  app: {
    name: 'canvas-forge',
    tagline: 'Paint-style image editor that runs entirely in the browser',
  },
  theme: {
    label: 'Theme',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
  },
  header: {
    file: 'File',
    new: 'New image',
    open: 'Open',
    save: 'Save',
    undo: 'Undo',
    redo: 'Redo',
    source: 'Source code on GitHub',
  },
  panels: {
    tools: 'Tools',
    properties: 'Properties',
    colors: 'Colors',
    brush: 'Brush',
    layers: 'Layers',
    comingSoon: 'Coming in a later version.',
  },
  tools: {
    select: 'Select',
    hand: 'Hand',
    pencil: 'Pencil',
    brush: 'Brush',
    eraser: 'Eraser',
    fill: 'Fill',
    picker: 'Color picker',
    text: 'Text',
    line: 'Line',
    rectangle: 'Rectangle',
    ellipse: 'Ellipse',
    unavailable: '{tool}: coming soon',
  },
  colors: {
    primary: 'Color 1',
    secondary: 'Color 2',
    swap: 'Swap colors',
    palette: 'Palette',
    hint: 'Click for color 1, right-click for color 2.',
  },
  brush: {
    size: 'Size',
  },
  canvas: {
    label: 'Image',
  },
  status: {
    position: 'Cursor',
    size: 'Image',
    zoom: 'Zoom',
  },
  language: {
    label: 'Language',
  },
}
