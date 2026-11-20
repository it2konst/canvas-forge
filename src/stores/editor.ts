import { defineStore } from 'pinia'
import { markRaw, ref, watch } from 'vue'
import { TOOLS, type ToolId } from '@/tools/catalog'
import { isToolReady } from '@/tools/painters'
import { FONTS } from '@/tools/fonts'
import { isHexColor, isIntIn, isOneOf, persisted } from './persisted'
import { Editor } from '@/engine/editor'
import { i18n } from '@/i18n'
import type { Point, Rect } from '@/engine/geometry'
import type { PaintButton } from '@/engine/input'
import type { ShapeSettings, ShapeStyle } from '@/engine/tools/shapes'
import { fontById, type FontId } from '@/tools/fonts'
import type { ResizeOperation } from '@/engine/resize'

/** Editor state shared by the panels, plus the drawing engine instance. */
export const useEditorStore = defineStore('editor', () => {
  // Tool, colours and options are remembered between visits.
  const savedTool = persisted<ToolId>(
    'tool',
    'brush',
    (v): v is ToolId => isOneOf(TOOLS.map((t) => t.id))(v) && isToolReady(v),
  )
  const activeTool = ref<ToolId>(savedTool.value)
  // The picker is momentary, so the tool it will return to is what is saved.
  watch(activeTool, (tool) => {
    if (tool !== 'picker') savedTool.value = tool
  })
  /** The tool to return to after the colour picker, like in Paint. */
  const previousTool = ref<ToolId>('brush')
  watch(activeTool, (next, prev) => {
    if (next === 'picker' && prev !== 'picker') previousTool.value = prev
  })

  const primaryColor = persisted('color1', '#000000', isHexColor)
  const secondaryColor = persisted('color2', '#FFFFFF', isHexColor)
  const brushSize = persisted('size', 8, isIntIn(1, 100))
  const shapeStyle = persisted<ShapeStyle>(
    'shapeStyle',
    'outline',
    isOneOf(['outline', 'fill', 'both']),
  )
  /** 0..100; a little tolerance makes fills cover anti-aliased edges. */
  const fillTolerance = persisted('tolerance', 10, isIntIn(0, 100))
  const fontSize = persisted('fontSize', 32, isIntIn(8, 200))
  const fontId = persisted<FontId>('font', 'sans', isOneOf(FONTS.map((f) => f.id)))

  /** Text being typed: where it starts and which button opened it. */
  const textDraft = ref<{ at: Point; button: PaintButton; text: string } | null>(null)

  /** State of the copy kept in the browser (see useAutosave). */
  const autosave = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const autosavedAt = ref<number | null>(null)

  /** Name of the opened file without extension; suggested when saving. */
  const fileName = ref<string | null>(null)

  const canvasWidth = ref(1280)
  const canvasHeight = ref(800)

  // markRaw: the engine owns canvases and must not be made reactive.
  const engine = markRaw(
    new Editor(canvasWidth.value, canvasHeight.value, i18n.global.t('layers.background')),
  )

  const canUndo = ref(false)
  const canRedo = ref(false)
  engine.onHistoryChange(() => {
    canUndo.value = engine.canUndo
    canRedo.value = engine.canRedo
  })

  engine.onSizeChange(() => {
    canvasWidth.value = engine.doc.width
    canvasHeight.value = engine.doc.height
  })

  /** Mirrors of the engine's selection, for the overlay and the panel. */
  const selection = ref<Rect | null>(null)
  const floating = ref(false)
  engine.onSelectionChange(() => {
    const sel = engine.selection
    selection.value = sel && { ...sel }
    floating.value = engine.floating !== null
  })

  // Like Paint: leaving the select tool puts the selection down and drops it.
  watch(activeTool, (_tool, prev) => {
    if (prev === 'select') engine.select(null)
  })

  const undo = () => engine.undo()
  const redo = () => engine.redo()

  /** Pointer position in image pixels, or null when the pointer is off the canvas. */
  const pointer = ref<Point | null>(null)

  /**
   * Settings for a stroke with the active tool and the given mouse button.
   * Left paints with colour 1 and right with colour 2; the eraser swaps them,
   * so by default it paints with colour 2 (the background), like in Paint.
   */
  function strokeSettings(button: PaintButton): ShapeSettings {
    const usePrimary = (button === 'primary') !== (activeTool.value === 'eraser')
    const color = usePrimary ? primaryColor.value : secondaryColor.value
    const other = usePrimary ? secondaryColor.value : primaryColor.value
    return {
      color,
      size: brushSize.value,
      style: shapeStyle.value,
      // A filled shape uses the stroke colour; outline + fill fills with the other one.
      fillColor: shapeStyle.value === 'both' ? other : color,
    }
  }

  const colorFor = (button: PaintButton) =>
    button === 'primary' ? primaryColor.value : secondaryColor.value

  const fillAt = (point: Point, button: PaintButton) =>
    engine.fill(point, colorFor(button), fillTolerance.value)

  function openText(at: Point, button: PaintButton) {
    textDraft.value = { at: { x: Math.floor(at.x), y: Math.floor(at.y) }, button, text: '' }
  }

  /** Draws the text being typed onto the image, if there is any, and closes the editor. */
  async function commitText() {
    const draft = textDraft.value
    if (!draft) return
    textDraft.value = null
    if (!draft.text.trim()) return
    await engine.addText(draft.at, draft.text, {
      family: fontById(fontId.value).family,
      size: fontSize.value,
      color: colorFor(draft.button),
    })
  }

  const cancelText = () => (textDraft.value = null)

  // Switching tools keeps what was typed, like clicking away does.
  watch(activeTool, (tool) => {
    if (tool !== 'text') void commitText()
  })

  /** Applies a size change; text being typed is placed first so it is not lost. */
  async function resizeImage(op: ResizeOperation) {
    await commitText()
    return engine.resize(op)
  }

  function setColor(button: PaintButton, color: string) {
    if (button === 'primary') primaryColor.value = color
    else secondaryColor.value = color
  }

  function swapColors() {
    ;[primaryColor.value, secondaryColor.value] = [secondaryColor.value, primaryColor.value]
  }

  return {
    activeTool,
    primaryColor,
    secondaryColor,
    brushSize,
    shapeStyle,
    fillTolerance,
    fontSize,
    fontId,
    textDraft,
    fileName,
    autosave,
    autosavedAt,
    canvasWidth,
    canvasHeight,
    engine,
    canUndo,
    canRedo,
    selection,
    floating,
    undo,
    redo,
    pointer,
    strokeSettings,
    fillAt,
    previousTool,
    colorFor,
    openText,
    commitText,
    cancelText,
    resizeImage,
    setColor,
    swapColors,
  }
})
