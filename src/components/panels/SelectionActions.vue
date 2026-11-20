<script setup lang="ts">
import { computed } from 'vue'
import {
  iconCopy,
  iconCrop,
  iconCut,
  iconDelete,
  iconDeselect,
  iconPaste,
  iconSelectAll,
} from '@/icons'
import { useClipboard } from '@/composables/useClipboard'
import { useEditorStore } from '@/stores/editor'

const editor = useEditorStore()
const clipboard = useClipboard()
const has = computed(() => editor.selection !== null)

const actions = computed(() => [
  { id: 'selectAll', icon: iconSelectAll, keys: 'Ctrl+A', run: () => editor.engine.selectAll() },
  {
    id: 'deselect',
    icon: iconDeselect,
    keys: 'Esc',
    run: () => editor.engine.select(null),
    off: !has.value,
  },
  { id: 'copy', icon: iconCopy, keys: 'Ctrl+C', run: () => clipboard.copy() },
  { id: 'cut', icon: iconCut, keys: 'Ctrl+X', run: () => clipboard.cut(), off: !has.value },
  { id: 'paste', icon: iconPaste, keys: 'Ctrl+V', run: () => clipboard.pasteFromButton() },
  {
    id: 'crop',
    icon: iconCrop,
    keys: 'Ctrl+Shift+X',
    run: () => editor.engine.crop(),
    off: !has.value,
  },
  {
    id: 'delete',
    icon: iconDelete,
    keys: 'Delete',
    run: () => editor.engine.deleteSelection(editor.holeFill()),
    off: !has.value,
  },
])
</script>

<template>
  <div class="actions" role="group" :aria-label="$t('selection.actions')">
    <v-btn
      v-for="a in actions"
      :key="a.id"
      :prepend-icon="a.icon"
      :disabled="a.off"
      variant="tonal"
      size="small"
      class="text-none action"
      @click="a.run"
    >
      <span class="action__label">{{ $t(`selection.${a.id}`) }}</span>
      <kbd class="action__keys">{{ a.keys }}</kbd>
    </v-btn>
  </div>
  <p v-if="editor.selection" class="size">
    {{ editor.selection.width }} × {{ editor.selection.height }} px · {{ editor.selection.x }},
    {{ editor.selection.y }}
  </p>
</template>

<style scoped>
.actions {
  display: grid;
  gap: 4px;
}
.action {
  letter-spacing: 0;
}
.action :deep(.v-btn__content) {
  flex: 1;
  justify-content: space-between;
  gap: 8px;
}
.action__keys {
  font-family: var(--cf-font-mono);
  font-size: 0.6875rem;
  opacity: 0.65;
}
.size {
  font-family: var(--cf-font-mono);
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}
</style>
