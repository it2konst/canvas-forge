<script setup lang="ts">
import { iconSwap } from '@/icons'
import { DEFAULT_PALETTE } from '@/tools/palette'
import { useEditorStore } from '@/stores/editor'

const editor = useEditorStore()
</script>

<template>
  <div class="color-panel">
    <div class="current-colors">
      <div
        class="swatch swatch--secondary"
        :style="{ backgroundColor: editor.secondaryColor }"
        role="img"
        :aria-label="`${$t('colors.secondary')}: ${editor.secondaryColor}`"
      />
      <div
        class="swatch swatch--primary"
        :style="{ backgroundColor: editor.primaryColor }"
        role="img"
        :aria-label="`${$t('colors.primary')}: ${editor.primaryColor}`"
      />
      <v-btn
        class="swap"
        :icon="iconSwap"
        size="x-small"
        density="comfortable"
        :aria-label="$t('colors.swap')"
        @click="editor.swapColors"
      />
    </div>

    <div class="palette" role="group" :aria-label="$t('colors.palette')">
      <button
        v-for="color in DEFAULT_PALETTE"
        :key="color"
        type="button"
        class="palette__cell"
        :style="{ backgroundColor: color }"
        :title="color"
        :aria-label="color"
        @click="editor.primaryColor = color"
        @contextmenu.prevent="editor.secondaryColor = color"
      />
    </div>
    <p class="hint">{{ $t('colors.hint') }}</p>
  </div>
</template>

<style scoped>
.current-colors {
  position: relative;
  width: 72px;
  height: 56px;
  margin-bottom: 12px;
}
.swatch {
  position: absolute;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  /* Visible on both themes and on white or black swatches. */
  box-shadow:
    0 0 0 1px rgba(var(--v-border-color), 0.24),
    0 0 0 3px rgb(var(--v-theme-surface));
}
.swatch--primary {
  top: 0;
  left: 0;
  z-index: 1;
}
.swatch--secondary {
  bottom: 0;
  left: 18px;
}
.swap {
  position: absolute;
  right: -8px;
  top: -4px;
}
.palette {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 4px;
}
.palette__cell {
  aspect-ratio: 1;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  box-shadow: inset 0 0 0 1px rgba(var(--v-border-color), 0.2);
  transition: transform 0.1s ease;
}
.palette__cell:hover {
  transform: scale(1.12);
}
.palette__cell:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}
.hint {
  margin-top: 8px;
  font-size: 0.75rem;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}
@media (prefers-reduced-motion: reduce) {
  .palette__cell {
    transition: none;
  }
}
</style>
