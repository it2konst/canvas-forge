<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import {
  iconAddLayer,
  iconDeleteLayer,
  iconDuplicate,
  iconHidden,
  iconLayerDown,
  iconLayerUp,
  iconMergeDown,
  iconVisible,
} from '@/icons'
import { MAX_LAYERS, opacityFromPercent } from '@/engine/layers'
import { useEditorStore } from '@/stores/editor'
import LayerThumb from './LayerThumb.vue'

const editor = useEditorStore()

/** Shown top first, like every editor; indexes stay bottom-first. */
const rows = computed(() => editor.layers.map((layer, index) => ({ ...layer, index })).reverse())
const active = computed(() => editor.layers[editor.activeLayer])
const count = computed(() => editor.layers.length)

// --- Renaming --------------------------------------------------------------

const renaming = ref<number | null>(null)
const draftName = ref('')

async function startRename(index: number) {
  renaming.value = index
  draftName.value = editor.layers[index]?.name ?? ''
  await nextTick()
  const input = document.querySelector<HTMLInputElement>('.layer-row__input')
  input?.focus()
  input?.select()
}

function finishRename() {
  if (renaming.value === null) return
  editor.engine.renameLayer(renaming.value, draftName.value)
  renaming.value = null
}

// --- Opacity ---------------------------------------------------------------

const opacity = computed({
  get: () => Math.round((active.value?.opacity ?? 1) * 100),
  set: (percent: number) => {
    editor.engine.previewOpacity(editor.activeLayer, opacityFromPercent(percent))
    commitLater()
  },
})
// A drag or a run of arrow-key presses becomes one undo step.
const commitLater = useDebounceFn(() => editor.engine.commitOpacity(), 400)

function onRowKey(event: KeyboardEvent, index: number) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    editor.engine.setActiveLayer(index)
  } else if (event.key === 'F2') {
    event.preventDefault()
    void startRename(index)
  }
}
</script>

<template>
  <div class="layers">
    <div class="layers__toolbar" role="toolbar" :aria-label="$t('layers.actions')">
      <v-btn
        :icon="iconAddLayer"
        size="small"
        density="comfortable"
        :disabled="!editor.canAddLayer"
        :title="editor.canAddLayer ? $t('layers.add') : $t('layers.limit', { max: MAX_LAYERS })"
        :aria-label="$t('layers.add')"
        @click="editor.addLayer"
      />
      <v-btn
        :icon="iconDuplicate"
        size="small"
        density="comfortable"
        :disabled="!editor.canAddLayer"
        :title="$t('layers.duplicate')"
        :aria-label="$t('layers.duplicate')"
        @click="editor.duplicateLayer"
      />
      <v-btn
        :icon="iconDeleteLayer"
        size="small"
        density="comfortable"
        :disabled="count <= 1"
        :title="$t('layers.delete')"
        :aria-label="$t('layers.delete')"
        @click="editor.engine.deleteLayer()"
      />
      <v-spacer />
      <v-btn
        :icon="iconLayerUp"
        size="small"
        density="comfortable"
        :disabled="editor.activeLayer >= count - 1"
        :title="$t('layers.up')"
        :aria-label="$t('layers.up')"
        @click="editor.engine.moveLayer(1)"
      />
      <v-btn
        :icon="iconLayerDown"
        size="small"
        density="comfortable"
        :disabled="editor.activeLayer <= 0"
        :title="$t('layers.down')"
        :aria-label="$t('layers.down')"
        @click="editor.engine.moveLayer(-1)"
      />
      <v-btn
        :icon="iconMergeDown"
        size="small"
        density="comfortable"
        :disabled="!editor.canMergeDown"
        :title="$t('layers.mergeDown')"
        :aria-label="$t('layers.mergeDown')"
        @click="editor.engine.mergeDown()"
      />
    </div>

    <ul class="layers__list" :aria-label="$t('panels.layers')">
      <li
        v-for="row in rows"
        :key="row.id"
        class="layer-row"
        :class="{
          'layer-row--active': row.index === editor.activeLayer,
          'layer-row--hidden': !row.visible,
        }"
        role="button"
        tabindex="0"
        :aria-pressed="row.index === editor.activeLayer"
        :aria-label="row.name"
        @click="editor.engine.setActiveLayer(row.index)"
        @dblclick="startRename(row.index)"
        @keydown="onRowKey($event, row.index)"
      >
        <v-btn
          :icon="row.visible ? iconVisible : iconHidden"
          size="x-small"
          density="comfortable"
          variant="text"
          :title="row.visible ? $t('layers.hide') : $t('layers.show')"
          :aria-label="row.visible ? $t('layers.hide') : $t('layers.show')"
          :aria-pressed="row.visible"
          @click.stop="editor.engine.setLayerVisible(row.index, !row.visible)"
        />
        <LayerThumb :layer-id="row.id" />
        <input
          v-if="renaming === row.index"
          v-model="draftName"
          class="layer-row__input"
          maxlength="60"
          :aria-label="$t('layers.rename')"
          @click.stop
          @keydown.enter.stop="finishRename"
          @keydown.esc.stop="renaming = null"
          @blur="finishRename"
        />
        <span v-else class="layer-row__name" :title="$t('layers.renameHint')">{{ row.name }}</span>
        <span v-if="row.opacity < 1" class="layer-row__opacity">
          {{ Math.round(row.opacity * 100) }}%
        </span>
      </li>
    </ul>

    <v-slider
      v-model="opacity"
      :min="0"
      :max="100"
      :step="1"
      :label="$t('layers.opacity')"
      color="primary"
      density="compact"
      hide-details
      @end="editor.engine.commitOpacity()"
    >
      <template #append>
        <span class="value">{{ opacity }}%</span>
      </template>
    </v-slider>
  </div>
</template>

<style scoped>
.layers {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.layers__toolbar {
  display: flex;
  align-items: center;
  margin-inline: -4px;
}
.layers__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 280px;
  overflow-y: auto;
}
.layer-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 42px;
  padding: 4px 8px 4px 2px;
  border-radius: 8px;
  cursor: pointer;
  user-select: none;
}
.layer-row:hover {
  background: rgba(var(--v-theme-on-surface), var(--v-hover-opacity));
}
.layer-row--active,
.layer-row--active:hover {
  background: rgba(var(--v-theme-primary), 0.14);
}
.layer-row:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: -2px;
}
.layer-row--hidden .layer-row__name,
.layer-row--hidden :deep(.thumb) {
  opacity: 0.45;
}
.layer-row__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.875rem;
}
.layer-row__input {
  flex: 1;
  min-width: 0;
  padding: 2px 6px;
  border: 1px solid rgb(var(--v-theme-primary));
  border-radius: 4px;
  background: rgb(var(--v-theme-surface));
  color: inherit;
  font: inherit;
  font-size: 0.875rem;
  outline: none;
}
.layer-row__opacity,
.value {
  font-family: var(--cf-font-mono);
  font-size: 0.75rem;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}
.value {
  min-width: 40px;
  text-align: end;
}
</style>
