<script setup lang="ts">
import type { ShapeStyle } from '@/engine/tools/shapes'
import { useEditorStore } from '@/stores/editor'

const editor = useEditorStore()
const STYLES: readonly ShapeStyle[] = ['outline', 'fill', 'both']
</script>

<template>
  <v-btn-toggle
    v-model="editor.shapeStyle"
    mandatory
    density="comfortable"
    variant="outlined"
    divided
    class="shape-style"
    :aria-label="$t('options.shapeStyle')"
  >
    <v-btn
      v-for="style in STYLES"
      :key="style"
      :value="style"
      :aria-label="$t(`options.style.${style}`)"
      :title="$t(`options.style.${style}`)"
    >
      <!-- Preview in the real colours: what you see is what the shape gets. -->
      <svg viewBox="0 0 24 16" width="28" height="18" aria-hidden="true">
        <rect
          x="2"
          y="2"
          width="20"
          height="12"
          rx="2"
          :fill="
            style === 'outline'
              ? 'none'
              : style === 'fill'
                ? editor.primaryColor
                : editor.secondaryColor
          "
          :stroke="style === 'fill' ? 'none' : editor.primaryColor"
          stroke-width="2.5"
        />
      </svg>
    </v-btn>
  </v-btn-toggle>
</template>

<style scoped>
.shape-style {
  width: 100%;
}
.shape-style :deep(.v-btn) {
  flex: 1;
}
/* White or black swatches stay visible on both themes. */
.shape-style svg rect {
  paint-order: stroke;
  filter: drop-shadow(0 0 0.5px rgba(var(--v-border-color), 0.6));
}
</style>
