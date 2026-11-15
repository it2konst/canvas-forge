<script setup lang="ts">
import { computed } from 'vue'
import { useEditorStore } from '@/stores/editor'
import { isToolReady } from '@/tools/painters'

/** Below this on-screen size an outline is useless; the crosshair takes over. */
const MIN_VISIBLE_PX = 5

const editor = useEditorStore()

const shape = computed(() => (editor.activeTool === 'brush' ? 'circle' : 'square'))

const style = computed(() => {
  const p = editor.pointer
  if (!p || !isToolReady(editor.activeTool)) return null

  const scale = editor.zoom
  const size = Math.max(1, Math.round(editor.brushSize))
  const px = size * scale
  if (px < MIN_VISIBLE_PX) return null

  // Hard tools snap to the pixel grid exactly as they will paint;
  // the round brush is centred on the pixel under the cursor.
  const offset = shape.value === 'square' ? Math.floor(size / 2) : size / 2 - 0.5
  return {
    width: `${px}px`,
    height: `${px}px`,
    transform: `translate(${(p.x - offset) * scale}px, ${(p.y - offset) * scale}px)`,
  }
})

defineExpose({ visible: computed(() => style.value !== null) })
</script>

<template>
  <div v-if="style" class="brush-cursor" :class="`brush-cursor--${shape}`" :style="style" />
</template>

<style scoped>
/* Two-tone outline: readable on white, black and everything between. */
.brush-cursor {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  border: 1px solid rgba(0, 0, 0, 0.75);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.75),
    inset 0 0 0 1px rgba(255, 255, 255, 0.75);
  will-change: transform;
}
.brush-cursor--circle {
  border-radius: 50%;
}
</style>
