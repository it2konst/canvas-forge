<script setup lang="ts">
import { computed } from 'vue'
import { useEditorStore } from '@/stores/editor'

const editor = useEditorStore()

const position = computed(() =>
  editor.pointer ? `${editor.pointer.x}, ${editor.pointer.y} px` : '—',
)
const size = computed(() => `${editor.canvasWidth} × ${editor.canvasHeight} px`)
const zoom = computed(() => `${Math.round(editor.zoom * 100)}%`)
</script>

<template>
  <v-footer app height="28" color="surface" border="t" class="status-bar">
    <span :title="$t('status.position')">
      <span class="label">{{ $t('status.position') }}:</span> {{ position }}
    </span>
    <span :title="$t('status.size')">
      <span class="label">{{ $t('status.size') }}:</span> {{ size }}
    </span>
    <v-spacer />
    <span :title="$t('status.zoom')">{{ zoom }}</span>
  </v-footer>
</template>

<style scoped>
.status-bar {
  gap: 20px;
  padding-inline: 12px;
  font-family: var(--cf-font-mono);
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  white-space: nowrap;
  overflow: hidden;
}
.label {
  font-family: var(--v-font-body);
}
@media (max-width: 600px) {
  .label {
    display: none;
  }
}
</style>
