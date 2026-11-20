<script setup lang="ts">
import { computed } from 'vue'
import { toolById } from '@/tools/catalog'
import { useEditorStore } from '@/stores/editor'
import ShapeStylePicker from './ShapeStylePicker.vue'
import { FONTS } from '@/tools/fonts'
import SelectionActions from './SelectionActions.vue'

const editor = useEditorStore()
const tool = computed(() => toolById(editor.activeTool))
const has = (option: string) => tool.value.options.some((o) => o === option)
const isShape = computed(() => ['line', 'rectangle', 'ellipse'].includes(tool.value.id))
</script>

<template>
  <!-- Focus may move here while text is being typed without closing the text box. -->
  <div class="tool-options" data-keeps-text-open>
    <v-slider
      v-if="has('size')"
      v-model="editor.brushSize"
      :min="1"
      :max="100"
      :step="1"
      :label="$t('options.size')"
      color="primary"
      density="compact"
      hide-details
    >
      <template #append>
        <span class="value">{{ editor.brushSize }}&nbsp;px</span>
      </template>
    </v-slider>

    <template v-if="has('tolerance')">
      <v-slider
        v-model="editor.fillTolerance"
        :min="0"
        :max="100"
        :step="1"
        :label="$t('options.tolerance')"
        color="primary"
        density="compact"
        hide-details
      >
        <template #append>
          <span class="value">{{ editor.fillTolerance }}%</span>
        </template>
      </v-slider>
      <p class="hint">{{ $t('options.toleranceHint') }}</p>
    </template>

    <template v-if="has('shapeStyle')">
      <div class="label">{{ $t('options.shapeStyle') }}</div>
      <ShapeStylePicker />
    </template>

    <template v-if="has('font')">
      <v-slider
        v-model="editor.fontSize"
        :min="8"
        :max="200"
        :step="1"
        :label="$t('options.fontSize')"
        color="primary"
        density="compact"
        hide-details
      >
        <template #append>
          <span class="value">{{ editor.fontSize }}&nbsp;px</span>
        </template>
      </v-slider>
      <div class="label">{{ $t('options.font') }}</div>
      <v-btn-toggle
        v-model="editor.fontId"
        mandatory
        density="comfortable"
        variant="outlined"
        divided
        class="font-picker"
        :aria-label="$t('options.font')"
      >
        <v-btn
          v-for="font in FONTS"
          :key="font.id"
          :value="font.id"
          :title="font.label"
          :aria-label="font.label"
          :style="{ fontFamily: font.family }"
          class="text-none"
        >
          Aa
        </v-btn>
      </v-btn-toggle>
      <p class="hint">{{ $t('options.textHint') }}</p>
    </template>

    <template v-if="has('selection')">
      <SelectionActions />
      <p class="hint">{{ $t('selection.hint') }}</p>
    </template>

    <p v-if="has('eraserHint')" class="hint">{{ $t('options.eraserHint') }}</p>

    <p v-if="has('pickerHint')" class="hint">{{ $t('options.pickerHint') }}</p>

    <p v-if="isShape" class="hint">{{ $t(`options.shiftHint.${tool.id}`) }}</p>

    <p v-if="!tool.options.length" class="hint">{{ $t('panels.comingSoon') }}</p>
  </div>
</template>

<style scoped>
.tool-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.label {
  margin-bottom: -4px;
  font-size: 0.8125rem;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}
.value {
  min-width: 48px;
  text-align: end;
  font-family: var(--cf-font-mono);
  font-size: 0.8125rem;
}
.font-picker {
  width: 100%;
}
.font-picker :deep(.v-btn) {
  flex: 1;
  font-size: 1rem;
  letter-spacing: 0;
}
.hint {
  font-size: 0.75rem;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}
</style>
