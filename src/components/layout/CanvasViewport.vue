<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, useTemplateRef, watch } from 'vue'
import { useDevicePixelRatio, useElementSize } from '@vueuse/core'
import { useTheme } from 'vuetify'
import { useEditorStore } from '@/stores/editor'
import { useViewStore } from '@/stores/view'
import { useCanvasInput } from '@/composables/useCanvasInput'
import { useWheel } from '@/composables/useWheel'
import { usePanning } from '@/composables/usePanning'
import { usePinch } from '@/composables/usePinch'
import BrushCursor from './BrushCursor.vue'
import TextBox from './TextBox.vue'
import SelectionOverlay from './SelectionOverlay.vue'

const editor = useEditorStore()
const view = useViewStore()
const { pixelRatio } = useDevicePixelRatio()
const theme = useTheme()

const viewport = useTemplateRef('viewport')
const screen = useTemplateRef('screen')
const brushCursor = useTemplateRef('brushCursor')
const { width, height } = useElementSize(viewport)

watch([width, height], ([w, h]) => view.setViewport({ width: w, height: h }), { immediate: true })

/** Overlays (brush outline, text box) live in image space, clipped to the image. */
const stageStyle = computed(() => {
  const { zoom, x, y } = view.view
  return {
    left: `${x}px`,
    top: `${y}px`,
    width: `${editor.canvasWidth * zoom}px`,
    height: `${editor.canvasHeight * zoom}px`,
  }
})

// --- Painting the document onto the visible canvas ------------------------

let frame = 0

/**
 * The visible canvas covers the whole viewport; the image is drawn into it
 * through the view transform. Only the visible part of the image is drawn,
 * so very high zoom levels cost no more than 100%.
 */
function paint() {
  frame = 0
  const canvas = screen.value
  const ctx = canvas?.getContext('2d')
  if (!canvas || !ctx) return
  const { doc } = editor.engine
  const dpr = pixelRatio.value
  const { zoom } = view.view
  // Snap the image to device pixels so 100%, 200%... stay perfectly sharp.
  const x = Math.round(view.view.x * dpr) / dpr
  const y = Math.round(view.view.y * dpr) / dpr
  const portW = canvas.width / dpr
  const portH = canvas.height / dpr

  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  // Part of the image that is on screen, in image pixels.
  const sx = Math.max(0, Math.floor(-x / zoom))
  const sy = Math.max(0, Math.floor(-y / zoom))
  const ex = Math.min(doc.width, Math.ceil((portW - x) / zoom))
  const ey = Math.min(doc.height, Math.ceil((portH - y) / zoom))
  if (ex <= sx || ey <= sy) return
  const dx = x + sx * zoom
  const dy = y + sy * zoom
  const dw = (ex - sx) * zoom
  const dh = (ey - sy) * zoom

  // Soft shadow under the sheet. Shadow sizes ignore the transform, hence * dpr.
  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, 0.22)'
  ctx.shadowBlur = 24 * dpr
  ctx.shadowOffsetY = 6 * dpr
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(dx, dy, dw, dh)
  ctx.restore()

  // Transparent pixels show a checkerboard, anchored to the image so it
  // moves with it. Opaque images (the usual case) simply cover it.
  ctx.save()
  ctx.translate(x, y)
  ctx.fillStyle = checkerPattern(ctx)
  ctx.fillRect(dx - x, dy - y, dw, dh)
  ctx.restore()

  // Smoothed when zoomed out; hard pixels when zoomed in, as in any pixel editor.
  ctx.imageSmoothingEnabled = zoom < 1
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(doc.canvas, sx, sy, ex - sx, ey - sy, dx, dy, dw, dh)

  // Pixels being moved or pasted float above the image, clipped to it.
  const floating = editor.engine.floating
  if (floating) {
    ctx.save()
    ctx.beginPath()
    ctx.rect(x, y, doc.width * zoom, doc.height * zoom)
    ctx.clip()
    const { canvas: f } = floating
    ctx.drawImage(f, x + floating.x * zoom, y + floating.y * zoom, f.width * zoom, f.height * zoom)
    ctx.restore()
  }

  if (zoom >= PIXEL_GRID_ZOOM) drawPixelGrid(ctx, dpr, zoom, x, y, sx, sy, ex, ey)

  ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)'
  ctx.lineWidth = 1 / dpr
  ctx.strokeRect(
    x - 0.5 / dpr,
    y - 0.5 / dpr,
    doc.width * zoom + 1 / dpr,
    doc.height * zoom + 1 / dpr,
  )
}

/** Side of one checkerboard square, in CSS pixels; constant at every zoom. */
const CHECKER = 8
let checker: { key: string; pattern: CanvasPattern } | null = null

/** Checkerboard in the theme's colours, rebuilt only when they change. */
function checkerPattern(ctx: CanvasRenderingContext2D): CanvasPattern {
  const { colors } = theme.current.value
  const a = String(colors['checker-a'])
  const b = String(colors['checker-b'])
  const key = `${a}|${b}`
  if (checker?.key === key) return checker.pattern
  const tile = document.createElement('canvas')
  tile.width = tile.height = CHECKER * 2
  const t = tile.getContext('2d')!
  t.fillStyle = a
  t.fillRect(0, 0, CHECKER * 2, CHECKER * 2)
  t.fillStyle = b
  t.fillRect(CHECKER, 0, CHECKER, CHECKER)
  t.fillRect(0, CHECKER, CHECKER, CHECKER)
  checker = { key, pattern: ctx.createPattern(tile, 'repeat')! }
  return checker.pattern
}

/** From this zoom on, a grid shows where each image pixel is. */
const PIXEL_GRID_ZOOM = 8

function drawPixelGrid(
  ctx: CanvasRenderingContext2D,
  dpr: number,
  zoom: number,
  x: number,
  y: number,
  sx: number,
  sy: number,
  ex: number,
  ey: number,
) {
  ctx.beginPath()
  // Lines on device-pixel centres, one device pixel wide.
  const snap = (v: number) => (Math.round(v * dpr) + 0.5) / dpr
  for (let i = sx; i <= ex; i++) {
    const gx = snap(x + i * zoom)
    ctx.moveTo(gx, y + sy * zoom)
    ctx.lineTo(gx, y + ey * zoom)
  }
  for (let j = sy; j <= ey; j++) {
    const gy = snap(y + j * zoom)
    ctx.moveTo(x + sx * zoom, gy)
    ctx.lineTo(x + ex * zoom, gy)
  }
  // Neutral grey with low alpha reads on light and dark pixels alike.
  ctx.strokeStyle = 'rgba(128, 128, 128, 0.35)'
  ctx.lineWidth = 1 / dpr
  ctx.stroke()
}

/** Coalesces any number of repaint requests into one per animation frame. */
function schedulePaint() {
  if (!frame) frame = requestAnimationFrame(paint)
}

// The backing store matches physical pixels, so the image stays sharp on HiDPI screens.
watch(
  [width, height, pixelRatio, screen],
  ([w, h, dpr, canvas]) => {
    if (!canvas) return
    canvas.width = Math.max(1, Math.round(w * dpr))
    canvas.height = Math.max(1, Math.round(h * dpr))
    schedulePaint()
  },
  { immediate: true },
)

watch(() => view.view, schedulePaint)
watch(() => theme.current.value, schedulePaint)

let stopRender: (() => void) | undefined
onMounted(() => (stopRender = editor.engine.onRender(schedulePaint)))
onBeforeUnmount(() => {
  stopRender?.()
  cancelAnimationFrame(frame)
})

// Gestures first: they claim their pointers before a stroke can start.
usePinch(screen)
usePanning(screen)
useCanvasInput(screen)
useWheel(screen)

const panMode = computed(() => editor.activeTool === 'hand' || view.spaceHeld)

/** Over the selection the select tool moves it, so show the move cursor. */
const overSelection = computed(() => {
  const p = editor.pointer
  const sel = editor.selection
  return (
    editor.activeTool === 'select' &&
    !!p &&
    !!sel &&
    p.x >= sel.x &&
    p.y >= sel.y &&
    p.x < sel.x + sel.width &&
    p.y < sel.y + sel.height
  )
})
</script>

<template>
  <div ref="viewport" class="viewport bg-workspace">
    <canvas
      ref="screen"
      class="screen"
      :class="{
        'screen--grab': panMode && !view.dragging,
        'screen--grabbing': view.dragging,
        'screen--outline-cursor': !panMode && !view.dragging && brushCursor?.visible,
        'screen--text-cursor': !panMode && editor.activeTool === 'text',
        'screen--move': !panMode && overSelection,
      }"
      :aria-label="$t('canvas.label')"
      role="img"
    />
    <div class="stage" :style="stageStyle">
      <BrushCursor v-show="!panMode && !view.dragging" ref="brushCursor" />
      <TextBox v-if="editor.textDraft" />
      <SelectionOverlay />
    </div>
  </div>
</template>

<style scoped>
.viewport {
  position: absolute;
  inset: 0;
  overflow: hidden;
}
.screen {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  cursor: crosshair;
  /* The canvas handles every touch itself: no scrolling or zooming the page. */
  touch-action: none;
}
.stage {
  position: absolute;
  /* Clips the brush outline and text box to the image. */
  overflow: hidden;
  /* Events go to the canvas underneath; the text box opts back in. */
  pointer-events: none;
}
.screen--outline-cursor {
  cursor: none;
}
.screen--text-cursor {
  cursor: text;
}
.screen--move {
  cursor: move;
}
.screen--grab {
  cursor: grab;
}
.screen--grabbing {
  cursor: grabbing;
}
</style>
