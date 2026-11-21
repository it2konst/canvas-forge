# canvas-forge

[Русская версия](README.ru.md)

[![CI](https://github.com/it2konst/canvas-forge/actions/workflows/ci.yml/badge.svg)](https://github.com/it2konst/canvas-forge/actions/workflows/ci.yml)

**Live demo: [canvas-forge-beta.vercel.app](https://canvas-forge-beta.vercel.app)**

A Paint-style image editor that runs entirely in the browser. Familiar tools, a classic palette and the shortcuts you expect, in a calm interface that works by day and by night. Images stay on your device and are never uploaded anywhere.

Written from scratch with Vue 3 and TypeScript.

![canvas-forge in light and dark themes](docs/screenshots/overview.png)

> Every step of the [roadmap](#roadmap) is done: eleven tools, layers, selection and the clipboard, zoom, files, undo for everything, and an installable app that works offline. Ideas and bug reports are welcome.

## Features

- Pencil: hard-edged square pixels with no anti-aliasing, good for pixel art
- Brush: round and anti-aliased, smoothed with curves so fast strokes have no corners; pen pressure sets the width
- Eraser: paints with color 2 on the background layer, like in Paint, and erases to transparency on the layers above
- Line, rectangle and ellipse with a live preview; Shift gives 45° lines, squares and circles; shapes come as an outline, filled, or outlined with color 1 and filled with color 2
- Flood fill with adjustable tolerance, so fills reach into anti-aliased edges
- Color picker: click or drag to take color 1, right-click for color 2, then the previous tool comes back
- Text: type right on the image in the final font, size and color; multiple lines; Onest, a serif or JetBrains Mono
- Left button paints with color 1, right button with color 2
- Undo and redo for every change (up to 100 steps within a 256 MB budget); Escape cancels the stroke in progress
- The cursor shows the tool size at the current zoom, snapped to the pixel grid for the hard tools
- Smooth input: every pointer sample the hardware reports is used, strokes continue past the edge of the canvas
- Sharp on HiDPI screens: the canvas matches physical pixels
- Editor layout: tool rail, properties panel, canvas area and status bar
- Zoom from 3% to 6400%: Ctrl + wheel or trackpad pinch around the pointer, keyboard, or the control in the status bar with presets, fit to screen and actual size
- Pan with the hand tool, by holding Space, with the middle mouse button, or by scrolling
- Touch screens: pinch with two fingers to zoom and move; a pinch never leaves a mark
- Pixel grid from 800%, hard-edged pixels when zoomed in; only the visible part of the image is drawn, so deep zoom stays fast
- Image size: scale the picture, or change the canvas around it with one of nine anchors and new space in color 2; up to 8192 px a side, undoable
- Open images from disk, drop them anywhere on the window or paste them with Ctrl+V: PNG, JPEG, WebP, GIF, BMP, AVIF and SVG; EXIF rotation is respected
- Opening, a new image and pasting are undoable, so nothing is ever lost by accident
- Selection: drag a rectangle (marching ants), drag it to move the pixels, Ctrl + drag to copy them, arrow keys to nudge; moving and putting down is one undo step
- Clipboard: copy and cut to the system clipboard as PNG, so it pastes into other apps; pasted pictures float on top, ready to move; a picture larger than the canvas grows it, like in Paint
- Select all, delete, and crop to the selection, from the keyboard or the properties panel
- Colors, the active tool and its options are remembered between visits
- Layers: up to 20, with live thumbnails, visibility, opacity, renaming, reordering, duplicating and merging down; every tool works on the active layer and every layer action can be undone
- Undo for layers is cheap: deleting or reordering stores no pixels, the layer objects themselves stay in history
- New image with size presets (Full HD, square, story, A4) on a white, color 2 or transparent background; transparency is shown as a checkerboard
- Save as PNG, JPEG or WebP with a quality setting and the real file size shown before you download
- Autosave: the image is kept in the browser and comes back on the next visit
- 11 tools in three groups, each with a single-key shortcut that works on any keyboard layout
- The properties panel shows the options of the active tool
- Color 1 and color 2 with a swap button, and the classic 20-color palette: click for color 1, right-click for color 2
- Status bar with the cursor position in image pixels, the image size (click it to change) and the zoom control
- The image fits the screen until you zoom or pan, then stays where you put it
- Light, dark and system themes, tuned for long sessions: neutral grey chrome that does not tint your picture, no pure white or black, softened text contrast, every accent passes WCAG AA
- English and Russian interface; the browser language is picked on the first visit
- Responsive layout down to phone width: on narrow screens the properties panel becomes a drawer
- Strict Content-Security-Policy on deploy
- Works offline after the first visit: the whole app, fonts included, is cached by a service worker
- Installable as a standalone app (Chrome, Edge, Android, Safari on iOS and macOS); once installed it shows up under "Open with" for images in Chrome and Edge on desktop
- A new version is never forced on you: the app offers "Update" and reloads only when you agree, after saving your image
- Link preview: a shared link unfolds into a card in messengers and on social sites

## Privacy and security

- Everything happens in the browser: no server, no accounts, no analytics, no cookies.
- Theme, language, colors and tool settings are kept in `localStorage`, the current image (every layer) in IndexedDB; both stay on your device.
- Opened files are decoded locally; SVG files are rasterised through `<img>`, so scripts inside them never run.
- The service worker stores only the app itself, never your images.
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
| Drawing   | Canvas 2D, Pointer Events with pen pressure           |
| Quality   | ESLint (flat config), Prettier, vue-tsc               |
| Tests     | Vitest, GitHub Actions CI                             |
| Offline   | vite-plugin-pwa (Workbox), Web App Manifest           |
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
| `pnpm test`         | Run the unit tests once             |
| `pnpm test:watch`   | Run tests on every change           |
| `pnpm coverage`     | Tests with a coverage report        |

## Tests

Unit tests run with Vitest in Node and on every push in GitHub Actions. The drawing engine is plain TypeScript, so its core is tested without a browser:

- geometry: rectangle helpers and whole-pixel lines with no gaps
- history: undo and redo order, the redo branch, step and memory limits
- tools: pencil and eraser stamps, brush dots, the area each stroke reports, pressure thinning
- shapes: Shift constraints, pixel boxes, the live preview being erased between frames
- flood fill on small character maps: walls, diagonal gaps, tolerance, no-op fills, and a 1.5 megapixel area
- colors and text: hex parsing, pixel sampling, line spacing and covered area
- view: screen and image coordinates, fitting, zooming around a point, zoom steps, keeping the image on screen
- image size: anchors when growing or cropping, linked proportions, side limits, crisp whole-number scaling
- files: which files count as images, refusing huge or foreign files before decoding, scaling down oversized images, safe file names, sizes in each language
- selection: rectangles in every drag direction, clipping, hit testing, where pastes land; checks for settings read back from storage
- layers: reordering, which layer becomes active after a delete, numbered names, opacity, erasing to transparency, upgrading older autosaves
- the PWA setup: install requirements and icons in the manifest, file handlers matching what the editor opens, a complete link preview

## Keyboard shortcuts

| Keys                     | Action                                               |
| ------------------------ | ---------------------------------------------------- |
| `Ctrl+Z`                 | Undo                                                 |
| `Ctrl+Y`, `Ctrl+Shift+Z` | Redo                                                 |
| `Esc`                    | Cancel the stroke, or deselect                       |
| `Ctrl+=`, `Ctrl+-`       | Zoom in, zoom out                                    |
| `Ctrl+0`                 | Fit to screen                                        |
| `Ctrl+1`                 | Actual size (100%)                                   |
| `Ctrl+E`                 | Image size                                           |
| `Ctrl+O`                 | Open an image                                        |
| `Ctrl+S`                 | Save                                                 |
| `Ctrl+Alt+N`             | New image                                            |
| `Ctrl+V`                 | Paste an image (floats, ready to move)               |
| `Ctrl+A`                 | Select all                                           |
| `Ctrl+C`, `Ctrl+X`       | Copy, cut (the whole image when nothing is selected) |
| `Ctrl+Shift+X`           | Crop to the selection                                |
| `Delete`                 | Clear the selection to color 2                       |
| Arrows, Shift + arrows   | Move the selection by 1 px, 10 px                    |
| `Enter`                  | Put moved pixels down                                |
| `Space` + drag           | Pan with any tool                                    |
| Ctrl + wheel             | Zoom around the pointer                              |
| Wheel, Shift + wheel     | Scroll up and down, sideways                         |

On macOS use `Cmd` instead of `Ctrl`. Tools:

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
    panels/      properties panel and its sections (colors, tool options, selection, layers)
    dialogs/     image size, new image, save
    feedback/    notifications, drop overlay, update prompt
  composables/   theme and language sync, canvas input, wheel, panning, pinch, shortcuts,
                 opening, drop and paste, autosave, updates, "Open with"
  engine/        drawing engine in plain TypeScript: document, input, history, flood fill,
                 colors, view math, resizing, selection, layers
    tools/       pencil and eraser (hard square), brush (round, pressure), shapes, text
  i18n/          vue-i18n setup and EN/RU messages
  files/         loading and saving images, autosave storage
  plugins/       Vuetify setup
  stores/        Pinia: editor state, view, preferences, UI, notifications, stored settings
  theme/         light and dark palettes
  tools/         tool catalog and options, which engine tool backs each one, palette, fonts
  icons.ts       every icon the app uses, in one place
```

## Roadmap

1. ~~Project shell: layout and panels, themes, EN/RU~~ ✓
2. ~~Drawing engine: canvas, pencil, brush, eraser, pen pressure, undo and redo, tests and CI~~ ✓
3. ~~Shapes and fill: line, rectangle, ellipse, flood fill, color picker, text~~ ✓
4. ~~Zoom and pan, canvas size~~ ✓
5. ~~Files: open, paste, drag and drop, save as PNG / JPEG / WebP, autosave~~ ✓
6. ~~Selection: move, copy, cut, paste, crop~~ ✓
7. ~~Layers~~ ✓
8. ~~PWA: offline, install, open images with the app, link preview~~ ✓

## Author

Made by [it2konst](https://github.com/it2konst). Issues and suggestions are welcome in [GitHub Issues](https://github.com/it2konst/canvas-forge/issues).

## License

[MIT](LICENSE)
