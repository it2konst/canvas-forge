<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDebounceFn } from '@vueuse/core'
import {
  FORMATS,
  canEncodeWebp,
  download,
  encode,
  fileNameFor,
  formatBytes,
  sanitizeName,
  type ExportFormat,
} from '@/files/save'
import { useEditorStore } from '@/stores/editor'
import { useNotificationsStore } from '@/stores/notifications'
import { useUiStore } from '@/stores/ui'

const editor = useEditorStore()
const ui = useUiStore()
const notifications = useNotificationsStore()
const { t, locale } = useI18n()

const format = ref<ExportFormat>('png')
const quality = ref(90)
const name = ref('')
const estimate = ref<number | null>(null)
const encoding = ref(false)
const saving = ref(false)

const info = computed(() => FORMATS[format.value])
const webp = computed(() => canEncodeWebp())
const fileName = computed(() => fileNameFor(name.value, format.value))

/** Identifies the latest measurement, so a slow earlier one cannot overwrite it. */
let current: symbol | undefined

/** Encodes in the background to show the real file size before saving. */
const measure = useDebounceFn(async () => {
  const run = (current = Symbol())
  encoding.value = true
  try {
    const blob = await encode(editor.engine.doc.canvas, format.value, quality.value / 100)
    if (run === current) estimate.value = blob.size
  } catch {
    estimate.value = null
  } finally {
    if (run === current) encoding.value = false
  }
}, 250)

watch(
  () => ui.saveOpen,
  async (open) => {
    if (!open) return
    await editor.commitText()
    name.value = fileNameFor(editor.fileName, 'png').replace(/\.png$/, '')
    estimate.value = null
    void measure()
  },
)
watch([format, quality], () => ui.saveOpen && void measure())

async function save() {
  if (saving.value) return
  saving.value = true
  try {
    const blob = await encode(editor.engine.doc.canvas, format.value, quality.value / 100)
    download(blob, fileName.value)
    editor.fileName = sanitizeName(name.value) || null
    ui.saveOpen = false
  } catch {
    notifications.notify(t('save.failed'), 'error')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <v-dialog v-model="ui.saveOpen" max-width="440">
    <v-card :title="$t('save.title')">
      <v-card-text class="d-flex flex-column ga-4">
        <v-btn-toggle
          v-model="format"
          mandatory
          divided
          variant="outlined"
          density="comfortable"
          class="w-100"
          :aria-label="$t('save.format')"
        >
          <v-btn value="png" class="flex-1-1">PNG</v-btn>
          <v-btn value="jpeg" class="flex-1-1">JPEG</v-btn>
          <v-btn value="webp" class="flex-1-1" :disabled="!webp">WebP</v-btn>
        </v-btn-toggle>

        <p class="hint">{{ $t(`save.about.${format}`) }}</p>

        <v-slider
          v-if="info.lossy"
          v-model="quality"
          :min="10"
          :max="100"
          :step="1"
          :label="$t('save.quality')"
          color="primary"
          density="compact"
          hide-details
        >
          <template #append>
            <span class="value">{{ quality }}%</span>
          </template>
        </v-slider>

        <v-text-field
          v-model="name"
          :label="$t('save.name')"
          :suffix="`.${info.extension}`"
          density="compact"
          variant="outlined"
          hide-details
          autocomplete="off"
          spellcheck="false"
          @keydown.enter="save"
        />

        <div class="summary" aria-live="polite">
          <span>{{ editor.canvasWidth }} × {{ editor.canvasHeight }} px</span>
          <span>
            <template v-if="encoding">{{ $t('save.measuring') }}</template>
            <template v-else-if="estimate !== null">
              {{ $t('save.size', { size: formatBytes(estimate, locale) }) }}
            </template>
          </span>
        </div>
        <p class="hint">{{ $t('save.private') }}</p>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn @click="ui.saveOpen = false">{{ $t('imageSize.cancel') }}</v-btn>
        <v-btn color="primary" variant="flat" :loading="saving" @click="save">
          {{ $t('save.download') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.hint {
  font-size: 0.8125rem;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}
.value {
  min-width: 40px;
  text-align: end;
  font-family: var(--cf-font-mono);
  font-size: 0.8125rem;
}
.summary {
  display: flex;
  justify-content: space-between;
  font-family: var(--cf-font-mono);
  font-size: 0.8125rem;
  font-variant-numeric: tabular-nums;
}
</style>
