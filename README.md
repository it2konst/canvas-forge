# canvas-forge

[Русская версия](README.ru.md)

A Paint-style image editor that runs entirely in the browser. Familiar tools, a classic palette and the shortcuts you expect, in a calm interface that works by day and by night. Images stay on your device and are never uploaded anywhere.

Written from scratch with Vue 3 and TypeScript.

![canvas-forge in light and dark themes](docs/screenshots/overview.png)

> **Work in progress.** The editor shell is ready: layout, panels, themes and languages. Drawing arrives in the next stages of the [roadmap](#roadmap).

## Features

**Ready**

- Editor layout: tool rail, properties panel, canvas area and status bar
- 11 tools in three groups (selection and navigation, painting, shapes), each with a single-key shortcut
- Color 1 and color 2 with a swap button, and the classic 20-color palette: click for color 1, right-click for color 2
- Brush size control
- Status bar with the cursor position in image pixels, the image size and the zoom level
- The image fits the screen at any window size
- Light, dark and system themes, tuned for long sessions: neutral grey chrome that does not tint your picture, no pure white or black, softened text contrast, every accent passes WCAG AA
- English and Russian interface; the browser language is picked on the first visit
- Responsive layout down to phone width: on narrow screens the properties panel becomes a drawer
- Strict Content-Security-Policy on deploy

**Planned**

- Pencil, brush and eraser with pen pressure, undo and redo
- Line, rectangle, ellipse, flood fill, color picker and text
- Zoom and pan, resize the canvas
- Open, paste and drop images; save as PNG, JPEG or WebP; autosave in the browser
- Selection: move, copy, cut, paste, crop
- Layers
- Offline support and install as an app (PWA)

## Privacy and security

- Everything happens in the browser: no server, no accounts, no analytics, no cookies.
- Only the theme and language choices are kept, in `localStorage`.
- `v-html` is forbidden by the lint config, so user content is never injected as raw HTML.
- The deployed site sends a strict CSP: scripts, fonts and connections are limited to its own origin.

## Tech stack

| Area      | Choice                                                |
| --------- | ----------------------------------------------------- |
| Framework | Vue 3 (Composition API, `<script setup>`), TypeScript |
| Build     | Vite                                                  |
| UI        | Vuetify 4, Material Design Icons as SVG paths         |
| State     | Pinia, VueUse                                         |
| i18n      | vue-i18n, connected to Vuetify through its adapter    |
| Fonts     | Onest and JetBrains Mono, self-hosted via Fontsource  |
| Quality   | ESLint (flat config), Prettier, vue-tsc               |
| Packages  | pnpm                                                  |
| Hosting   | Vercel                                                |

## Getting started

Requires Node.js 22.15 or newer and pnpm 10.

```bash
pnpm install
pnpm dev
```

| Script              | What it does                        |
| ------------------- | ----------------------------------- |
| `pnpm dev`          | Start the dev server                |
| `pnpm build`        | Type-check and build for production |
| `pnpm preview`      | Serve the production build locally  |
| `pnpm lint`         | Lint and auto-fix                   |
| `pnpm lint:check`   | Lint without changing files         |
| `pnpm format`       | Format the project with Prettier    |
| `pnpm format:check` | Check formatting                    |
| `pnpm type-check`   | Run vue-tsc                         |

## Keyboard shortcuts

| Key | Tool   | Key | Tool         |
| --- | ------ | --- | ------------ |
| `S` | Select | `G` | Fill         |
| `H` | Hand   | `I` | Color picker |
| `P` | Pencil | `T` | Text         |
| `B` | Brush  | `L` | Line         |
| `E` | Eraser | `R` | Rectangle    |
|     |        | `O` | Ellipse      |

## Project structure

```text
src/
  components/
    layout/      header, tool rail, canvas area, status bar, theme and language menus
    panels/      properties panel and its sections (colors, brush, layers)
  composables/   theme and language sync, tool shortcuts
  i18n/          vue-i18n setup and EN/RU messages
  plugins/       Vuetify setup
  stores/        Pinia: editor state, preferences, UI
  theme/         light and dark palettes
  tools/         tool catalog and the default palette
  icons.ts       every icon the app uses, in one place
```

## Roadmap

1. ~~Project shell: layout and panels, themes, EN/RU~~ ✓
2. Drawing engine: canvas, pencil, brush, eraser, pen pressure, undo and redo
3. Shapes and fill: line, rectangle, ellipse, flood fill, color picker, text
4. Zoom and pan, canvas size
5. Files: open, paste, drag and drop, save as PNG / JPEG / WebP, autosave
6. Selection: move, copy, cut, paste, crop
7. Layers, tests and CI
8. PWA: offline, install, open images with the app

## Author

Made by [it2konst](https://github.com/it2konst). Issues and suggestions are welcome in [GitHub Issues](https://github.com/it2konst/canvas-forge/issues).

## License

[MIT](LICENSE)
