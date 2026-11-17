<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, useTemplateRef, watch } from 'vue'
import { useDevicePixelRatio, useElementSize } from '@vueuse/core'
import { useEditorStore } from '@/stores/editor'
import { useViewStore } from '@/stores/view'
import { useCanvasInput } from '@/composables/useCanvasInput'
import { useWheelZoom } from '@/composables/useWheelZoom'
import BrushCursor from './BrushCursor.vue'
import TextBox from './TextBox.vue'

const editor = useEditorStore()
const view = useViewStore()
const { pixelRatio } = useDevicePixelRatio()

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

  // Smoothed when zoomed out; hard pixels when zoomed in, as in any pixel editor.
  ctx.imageSmoothingEnabled = zoom < 1
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(doc.canvas, sx, sy, ex - sx, ey - sy, dx, dy, dw, dh)

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

let stopRender: (() => void) | undefined
onMounted(() => (stopRender = editor.engine.onRender(schedulePaint)))
onBeforeUnmount(() => {
  stopRender?.()
  cancelAnimationFrame(frame)
})

useCanvasInput(screen)
useWheelZoom(screen)
</script>

<template>
  <div ref="viewport" class="viewport bg-workspace">
    <canvas
      ref="screen"
      class="screen"
      :class="{
        'screen--outline-cursor': brushCursor?.visible,
        'screen--text-cursor': editor.activeTool === 'text',
      }"
      :aria-label="$t('canvas.label')"
      role="img"
    />
    <div class="stage" :style="stageStyle">
      <BrushCursor ref="brushCursor" />
      <TextBox v-if="editor.textDraft" />
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
</style>
