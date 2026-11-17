<script setup lang="ts">
import { computed } from 'vue'
import { useEditorStore } from '@/stores/editor'
import ZoomControl from './ZoomControl.vue'
import { useUiStore } from '@/stores/ui'

const editor = useEditorStore()
const ui = useUiStore()

const position = computed(() =>
  editor.pointer ? `${editor.pointer.x}, ${editor.pointer.y} px` : '-',
)
const size = computed(() => `${editor.canvasWidth} × ${editor.canvasHeight} px`)
</script>

<template>
  <v-footer app height="28" color="surface" border="t" class="status-bar">
    <span :title="$t('status.position')">
      <span class="label">{{ $t('status.position') }}:</span> {{ position }}
    </span>
    <!-- The size doubles as the way to change it, also on phones. -->
    <button
      type="button"
      class="size-button"
      :title="`${$t('imageSize.title')} (Ctrl+E)`"
      @click="ui.imageSizeOpen = true"
    >
      <span class="label">{{ $t('status.size') }}:</span> {{ size }}
    </button>
    <v-spacer />
    <ZoomControl />
  </v-footer>
</template>

<style scoped>
.status-bar {
  gap: 20px;
  padding-inline: 12px 4px;
  font-family: var(--cf-font-mono);
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  white-space: nowrap;
  overflow: hidden;
}
.size-button {
  font: inherit;
  color: inherit;
  padding: 2px 4px;
  margin-inline: -4px;
  border-radius: 4px;
  cursor: pointer;
}
.size-button:hover {
  background: rgba(var(--v-theme-on-surface), var(--v-hover-opacity));
}
.size-button:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
}
.label {
  font-family: var(--v-font-body);
}
@media (max-width: 600px) {
  .size-button {
    font: inherit;
    color: inherit;
    padding: 2px 4px;
    margin-inline: -4px;
    border-radius: 4px;
    cursor: pointer;
  }
  .size-button:hover {
    background: rgba(var(--v-theme-on-surface), var(--v-hover-opacity));
  }
  .size-button:focus-visible {
    outline: 2px solid rgb(var(--v-theme-primary));
  }
  .label {
    display: none;
  }
}
</style>
