<script setup lang="ts">
import { computed, nextTick, onMounted, useTemplateRef, watch } from 'vue'
import { TEXT_LINE_HEIGHT } from '@/engine/tools/text'
import { fontById } from '@/tools/fonts'
import { useEditorStore } from '@/stores/editor'

/**
 * The on-screen editor for the text tool: a borderless textarea laid over
 * the canvas in the same font, size and colour the text will be drawn
 * with, so what you type is what lands on the image.
 */
const editor = useEditorStore()
const field = useTemplateRef('field')

const draft = computed(() => editor.textDraft!)

const style = computed(() => {
  const scale = editor.zoom
  const size = editor.fontSize * scale
  return {
    left: `${draft.value.at.x * scale}px`,
    top: `${draft.value.at.y * scale}px`,
    fontFamily: fontById(editor.fontId).family,
    fontSize: `${size}px`,
    lineHeight: `${size * TEXT_LINE_HEIGHT}px`,
    color: editor.colorFor(draft.value.button),
  }
})

/** Grows the box with the text; no wrapping, like a Paint text box. */
function autosize() {
  const el = field.value
  if (!el) return
  el.style.width = '0'
  el.style.height = '0'
  el.style.width = `${el.scrollWidth + 2}px`
  el.style.height = `${el.scrollHeight}px`
}

watch([style, () => draft.value.text], () => nextTick(autosize))

onMounted(async () => {
  await nextTick()
  autosize()
  field.value?.focus()
})

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.stopPropagation()
    editor.cancelText()
  } else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
    event.preventDefault()
    void editor.commitText()
  }
}

function onBlur(event: FocusEvent) {
  // Adjusting the font or size in the panel keeps the text open.
  const next = event.relatedTarget as HTMLElement | null
  if (next?.closest('[data-keeps-text-open]')) return
  void editor.commitText()
}
</script>

<template>
  <textarea
    ref="field"
    v-model="draft.text"
    class="text-box"
    :style="style"
    wrap="off"
    spellcheck="false"
    autocomplete="off"
    :aria-label="$t('options.textField')"
    @keydown="onKeydown"
    @blur="onBlur"
  />
</template>

<style scoped>
.text-box {
  position: absolute;
  min-width: 1ch;
  margin: 0;
  padding: 0;
  border: none;
  /* The outline sits outside the box, so the text does not shift when committed. */
  outline: 1px dashed rgba(0, 0, 0, 0.6);
  outline-offset: 2px;
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.6);
  background: transparent;
  resize: none;
  overflow: hidden;
  white-space: pre;
  font-weight: 400;
  caret-color: currentColor;
}
</style>
