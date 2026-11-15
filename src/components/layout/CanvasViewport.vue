<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, useTemplateRef, watch, watchEffect } from 'vue'
import { useDevicePixelRatio, useElementSize } from '@vueuse/core'
import { useDisplay } from 'vuetify'
import { useEditorStore } from '@/stores/editor'
import { useCanvasInput } from '@/composables/useCanvasInput'
import BrushCursor from './BrushCursor.vue'

const editor = useEditorStore()
const { xs } = useDisplay()
const { pixelRatio } = useDevicePixelRatio()

const viewport = useTemplateRef('viewport')
const screen = useTemplateRef('screen')
const brushCursor = useTemplateRef('brushCursor')
const { width, height } = useElementSize(viewport)

const padding = computed(() => (xs.value ? 12 : 32))

// Fit the whole image on screen, never upscale past 100%.
// Manual zoom and panning replace this in a later stage.
const fitScale = computed(() => {
  const w = width.value - padding.value * 2
  const h = height.value - padding.value * 2
  if (w <= 0 || h <= 0) return 1
  return Math.min(1, w / editor.canvasWidth, h / editor.canvasHeight)
})

watchEffect(() => (editor.zoom = fitScale.value))

const cssWidth = computed(() => Math.round(editor.canvasWidth * fitScale.value))
const cssHeight = computed(() => Math.round(editor.canvasHeight * fitScale.value))

// --- Painting the document onto the visible canvas ------------------------

let frame = 0

function paint() {
  frame = 0
  const canvas = screen.value
  const ctx = canvas?.getContext('2d')
  if (!canvas || !ctx) return
  const { doc } = editor.engine
  // Downscaled views look better smoothed; at 1:1 and above keep pixels crisp.
  ctx.imageSmoothingEnabled = canvas.width < doc.width
  ctx.imageSmoothingQuality = 'high'
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(doc.canvas, 0, 0, canvas.width, canvas.height)
}

/** Coalesces any number of repaint requests into one per animation frame. */
function schedulePaint() {
  if (!frame) frame = requestAnimationFrame(paint)
}

// The backing store matches physical pixels, so the image stays sharp on HiDPI screens.
watch(
  [cssWidth, cssHeight, pixelRatio, screen],
  ([w, h, dpr, canvas]) => {
    if (!canvas) return
    canvas.width = Math.max(1, Math.round(w * dpr))
    canvas.height = Math.max(1, Math.round(h * dpr))
    schedulePaint()
  },
  { immediate: true },
)

let stopRender: (() => void) | undefined
onMounted(() => (stopRender = editor.engine.onRender(schedulePaint)))
onBeforeUnmount(() => {
  stopRender?.()
  cancelAnimationFrame(frame)
})

useCanvasInput(screen)
</script>

<template>
  <div ref="viewport" class="viewport bg-workspace">
    <div class="stage" :style="{ width: `${cssWidth}px`, height: `${cssHeight}px` }">
      <canvas
        ref="screen"
        class="screen"
        :class="{ 'screen--outline-cursor': brushCursor?.visible }"
        :aria-label="$t('canvas.label')"
        role="img"
      />
      <BrushCursor ref="brushCursor" />
    </div>
  </div>
</template>

<style scoped>
.viewport {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  overflow: hidden;
}
.stage {
  position: relative;
  /* Keeps the brush outline from spilling over the panels. */
  overflow: hidden;
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.08),
    0 8px 24px -8px rgba(0, 0, 0, 0.25);
}
.screen {
  display: block;
  width: 100%;
  height: 100%;
  cursor: crosshair;
  /* The canvas handles every touch itself: no scrolling or zooming the page. */
  touch-action: none;
}
.screen--outline-cursor {
  cursor: none;
}
</style>
