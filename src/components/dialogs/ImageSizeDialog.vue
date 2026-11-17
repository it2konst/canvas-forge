<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { iconLink, iconLinkOff } from '@/icons'
import { MAX_SIDE, clampSide, keepAspect, type Anchor } from '@/engine/resize'
import { useEditorStore } from '@/stores/editor'
import { useUiStore } from '@/stores/ui'
import AnchorPicker from './AnchorPicker.vue'

type Mode = 'scale' | 'canvas'

const editor = useEditorStore()
const ui = useUiStore()
const { t } = useI18n()

const mode = ref<Mode>('scale')
const width = ref(0)
const height = ref(0)
const linked = ref(true)
const anchor = ref<Anchor>({ x: 0.5, y: 0.5 })

const current = computed(() => ({ width: editor.canvasWidth, height: editor.canvasHeight }))

// Fresh values each time the dialog opens.
watch(
  () => ui.imageSizeOpen,
  (open) => {
    if (!open) return
    width.value = current.value.width
    height.value = current.value.height
  },
)

// Scaling keeps proportions by default; changing the canvas usually does not.
watch(mode, (m) => (linked.value = m === 'scale'))

function onWidth(value: string) {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return
  if (linked.value)
    ({ width: width.value, height: height.value } = keepAspect(current.value, 'width', n))
  else width.value = clampSide(n)
}

function onHeight(value: string) {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return
  if (linked.value)
    ({ width: width.value, height: height.value } = keepAspect(current.value, 'height', n))
  else height.value = clampSide(n)
}

const rules = [
  (v: string | number) =>
    (Number.isInteger(Number(v)) && Number(v) >= 1 && Number(v) <= MAX_SIDE) ||
    t('imageSize.range', { max: MAX_SIDE }),
]

const valid = computed(
  () => rules.every((r) => r(width.value) === true) && rules.every((r) => r(height.value) === true),
)
const unchanged = computed(
  () => width.value === current.value.width && height.value === current.value.height,
)

async function apply() {
  if (!valid.value) return
  const size = { width: clampSide(width.value), height: clampSide(height.value) }
  if (mode.value === 'scale') await editor.resizeImage({ kind: 'scale', ...size })
  else
    await editor.resizeImage({
      kind: 'canvas',
      ...size,
      anchor: anchor.value,
      fill: editor.secondaryColor,
    })
  ui.imageSizeOpen = false
}
</script>

<template>
  <v-dialog v-model="ui.imageSizeOpen" max-width="440">
    <v-card :title="$t('imageSize.title')">
      <v-card-text class="d-flex flex-column ga-4">
        <v-btn-toggle v-model="mode" mandatory divided variant="outlined" density="comfortable">
          <v-btn value="scale" class="flex-1-1">{{ $t('imageSize.scale') }}</v-btn>
          <v-btn value="canvas" class="flex-1-1">{{ $t('imageSize.canvas') }}</v-btn>
        </v-btn-toggle>

        <p class="hint">
          {{ $t(mode === 'scale' ? 'imageSize.scaleHint' : 'imageSize.canvasHint') }}
        </p>

        <div class="size-row">
          <v-text-field
            :model-value="width"
            :label="$t('imageSize.width')"
            type="number"
            min="1"
            :max="MAX_SIDE"
            suffix="px"
            density="compact"
            variant="outlined"
            :rules="rules"
            hide-spin-buttons
            @update:model-value="onWidth"
          />
          <v-btn
            :icon="linked ? iconLink : iconLinkOff"
            :active="linked"
            :aria-label="$t('imageSize.keepRatio')"
            :title="$t('imageSize.keepRatio')"
            :aria-pressed="linked"
            size="small"
            class="mt-1"
            @click="linked = !linked"
          />
          <v-text-field
            :model-value="height"
            :label="$t('imageSize.height')"
            type="number"
            min="1"
            :max="MAX_SIDE"
            suffix="px"
            density="compact"
            variant="outlined"
            :rules="rules"
            hide-spin-buttons
            @update:model-value="onHeight"
          />
        </div>

        <div v-if="mode === 'canvas'" class="d-flex ga-4 align-center">
          <AnchorPicker v-model="anchor" />
          <div class="hint">
            <div>{{ $t('imageSize.anchorHint') }}</div>
            <div class="d-flex align-center ga-2 mt-2">
              <span class="fill-swatch" :style="{ backgroundColor: editor.secondaryColor }" />
              {{ $t('imageSize.fillHint') }}
            </div>
          </div>
        </div>

        <p class="hint">
          {{ $t('imageSize.current', { width: current.width, height: current.height }) }}
        </p>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn @click="ui.imageSizeOpen = false">{{ $t('imageSize.cancel') }}</v-btn>
        <v-btn color="primary" variant="flat" :disabled="!valid || unchanged" @click="apply">
          {{ $t('imageSize.apply') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.size-row {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 8px;
  align-items: start;
}
.hint {
  font-size: 0.8125rem;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}
.fill-swatch {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  box-shadow: inset 0 0 0 1px rgba(var(--v-border-color), 0.3);
}
</style>
