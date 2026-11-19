<script setup lang="ts">
import { computed } from 'vue'
import { useEditorStore } from '@/stores/editor'
import { useViewStore } from '@/stores/view'

const editor = useEditorStore()
const view = useViewStore()

const style = computed(() => {
  const sel = editor.selection
  if (!sel) return null
  const z = view.zoom
  return {
    transform: `translate(${sel.x * z}px, ${sel.y * z}px)`,
    width: `${sel.width * z}px`,
    height: `${sel.height * z}px`,
  }
})
</script>

<template>
  <!-- Marching ants: black and white dashes, visible on any picture. -->
  <div v-if="style" class="selection" :style="style" aria-hidden="true" />
</template>

<style scoped>
.selection {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  background-image:
    linear-gradient(90deg, #000 50%, #fff 50%), linear-gradient(90deg, #000 50%, #fff 50%),
    linear-gradient(0deg, #000 50%, #fff 50%), linear-gradient(0deg, #000 50%, #fff 50%);
  background-repeat: repeat-x, repeat-x, repeat-y, repeat-y;
  background-size:
    8px 1px,
    8px 1px,
    1px 8px,
    1px 8px;
  background-position:
    0 0,
    0 100%,
    0 0,
    100% 0;
  animation: ants 0.6s linear infinite;
}
@keyframes ants {
  to {
    background-position:
      8px 0,
      -8px 100%,
      0 -8px,
      100% 8px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .selection {
    animation: none;
  }
}
</style>
