<script setup lang="ts">
import { computed, useTemplateRef, watchEffect } from 'vue'
import { useElementSize } from '@vueuse/core'
import { useDisplay } from 'vuetify'
import { useEditorStore } from '@/stores/editor'

const editor = useEditorStore()
const { xs } = useDisplay()

const viewport = useTemplateRef('viewport')
const { width, height } = useElementSize(viewport)

const padding = computed(() => (xs.value ? 12 : 32))

// Fit the whole image on screen, never upscale past 100%.
// Manual zoom and panning replace this in the drawing stage.
const fitScale = computed(() => {
  const w = width.value - padding.value * 2
  const h = height.value - padding.value * 2
  if (w <= 0 || h <= 0) return 1
  return Math.min(1, w / editor.canvasWidth, h / editor.canvasHeight)
})

watchEffect(() => (editor.zoom = fitScale.value))

const sheetStyle = computed(() => ({
  width: `${Math.round(editor.canvasWidth * fitScale.value)}px`,
  height: `${Math.round(editor.canvasHeight * fitScale.value)}px`,
}))

// Maps the pointer from screen pixels to image pixels, whatever the scale.
function trackPointer(event: PointerEvent) {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const x = Math.floor(((event.clientX - rect.left) / rect.width) * editor.canvasWidth)
  const y = Math.floor(((event.clientY - rect.top) / rect.height) * editor.canvasHeight)
  editor.pointer = { x, y }
}
</script>

<template>
  <div ref="viewport" class="viewport bg-workspace">
    <!-- Placeholder sheet; the real <canvas> stack replaces it in the drawing stage. -->
    <div
      class="sheet"
      :style="sheetStyle"
      :aria-label="$t('canvas.label')"
      role="img"
      @pointermove="trackPointer"
      @pointerleave="editor.pointer = null"
    />
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
.sheet {
  /* The image itself is white paper in both themes, like in any editor. */
  background: #ffffff;
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.08),
    0 8px 24px -8px rgba(0, 0, 0, 0.25);
  cursor: crosshair;
}
</style>
