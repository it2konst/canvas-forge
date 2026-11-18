<script setup lang="ts">
import { computed } from 'vue'
import { useEditorStore } from '@/stores/editor'
import ZoomControl from './ZoomControl.vue'
import { useUiStore } from '@/stores/ui'
import { useI18n } from 'vue-i18n'
import { iconAutosaveError, iconAutosaved } from '@/icons'

const editor = useEditorStore()
const ui = useUiStore()
const { t, locale } = useI18n()

/** Tells the user their work is kept in the browser, and when it last was. */
const autosave = computed(() => {
  if (editor.autosave === 'idle') return null
  if (editor.autosave === 'error') {
    return { icon: iconAutosaveError, text: t('autosave.error'), title: t('autosave.failed') }
  }
  const time = editor.autosavedAt
    ? new Date(editor.autosavedAt).toLocaleTimeString(locale.value, {
        hour: '2-digit',
        minute: '2-digit',
      })
    : ''
  return {
    icon: iconAutosaved,
    text: editor.autosave === 'saving' ? t('autosave.saving') : t('autosave.saved'),
    title: t('autosave.title', { time }),
  }
})

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
    <span
      v-if="autosave"
      class="autosave"
      :class="{ 'autosave--error': editor.autosave === 'error' }"
      :title="autosave.title"
      role="status"
    >
      <v-icon :icon="autosave.icon" size="14" />
      <span class="label">{{ autosave.text }}</span>
    </span>
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
.autosave {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: var(--v-font-body);
}
.autosave--error {
  color: rgb(var(--v-theme-error));
}
.size-button {
  border: none;
  background: transparent;
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
  .autosave {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-family: var(--v-font-body);
  }
  .autosave--error {
    color: rgb(var(--v-theme-error));
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
    display: none;
  }
}
</style>
