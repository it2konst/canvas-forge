<script setup lang="ts">
import { onBeforeUnmount, onMounted, useTemplateRef, watch } from 'vue'
import { useThrottleFn } from '@vueuse/core'
import { useEditorStore } from '@/stores/editor'

const props = defineProps<{ layerId: number }>()

const WIDTH = 44
const HEIGHT = 32

const editor = useEditorStore()
const thumb = useTemplateRef('thumb')

/** Draws the layer scaled to fit, centred; redrawn at most a few times a second. */
function draw() {
  const canvas = thumb.value
  const layer = editor.engine.doc.layers.find((l) => l.id === props.layerId)
  if (!canvas || !layer) return
  const dpr = window.devicePixelRatio || 1
  canvas.width = WIDTH * dpr
  canvas.height = HEIGHT * dpr
  const ctx = canvas.getContext('2d')!
  const scale = Math.min(canvas.width / layer.canvas.width, canvas.height / layer.canvas.height)
  const w = layer.canvas.width * scale
  const h = layer.canvas.height * scale
  ctx.imageSmoothingQuality = 'high'
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(layer.canvas, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h)
}

const redraw = useThrottleFn(draw, 250, true)

let stop: (() => void) | undefined
onMounted(() => {
  draw()
  stop = editor.engine.onRender(() => void redraw())
})
onBeforeUnmount(() => stop?.())
watch(() => [editor.canvasWidth, editor.canvasHeight, props.layerId], draw)
</script>

<template>
  <canvas ref="thumb" class="thumb" :style="{ width: `${WIDTH}px`, height: `${HEIGHT}px` }" />
</template>

<style scoped>
.thumb {
  flex: none;
  border-radius: 4px;
  /* Transparent parts read as transparent, in both themes. */
  background: repeating-conic-gradient(
      rgb(var(--v-theme-checker-a)) 0% 25%,
      rgb(var(--v-theme-checker-b)) 0% 50%
    )
    50% / 8px 8px;
  box-shadow: inset 0 0 0 1px rgba(var(--v-border-color), 0.2);
}
</style>
