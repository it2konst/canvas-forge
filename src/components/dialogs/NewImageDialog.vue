<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { MAX_SIDE, clampSide } from '@/engine/resize'
import { useEditorStore } from '@/stores/editor'
import { useUiStore } from '@/stores/ui'
import { useViewStore } from '@/stores/view'

type Background = 'white' | 'color2' | 'transparent'

const editor = useEditorStore()
const ui = useUiStore()
const view = useViewStore()
const { t } = useI18n()

const PRESETS = [
  { id: 'hd', width: 1280, height: 800 },
  { id: 'fullHd', width: 1920, height: 1080 },
  { id: 'square', width: 1080, height: 1080 },
  { id: 'story', width: 1080, height: 1920 },
  { id: 'a4', width: 1240, height: 1754 },
  { id: 'small', width: 800, height: 600 },
] as const

const width = ref(1280)
const height = ref(800)
const background = ref<Background>('white')

watch(
  () => ui.newImageOpen,
  (open) => {
    if (!open) return
    width.value = editor.canvasWidth
    height.value = editor.canvasHeight
  },
)

const rules = [
  (v: string | number) =>
    (Number.isInteger(Number(v)) && Number(v) >= 1 && Number(v) <= MAX_SIDE) ||
    t('imageSize.range', { max: MAX_SIDE }),
]
const valid = computed(() => [width.value, height.value].every((v) => rules[0]!(v) === true))

const fillFor = (bg: Background) =>
  bg === 'white' ? '#FFFFFF' : bg === 'color2' ? editor.secondaryColor : 'transparent'

async function create() {
  if (!valid.value) return
  await editor.commitText()
  editor.engine.newImage(clampSide(width.value), clampSide(height.value), fillFor(background.value))
  editor.fileName = null
  view.fit()
  ui.newImageOpen = false
}
</script>

<template>
  <v-dialog v-model="ui.newImageOpen" max-width="460">
    <v-card :title="$t('newImage.title')">
      <v-card-text class="d-flex flex-column ga-4">
        <v-chip-group column :aria-label="$t('newImage.presets')">
          <v-chip
            v-for="p in PRESETS"
            :key="p.id"
            size="small"
            variant="outlined"
            :color="width === p.width && height === p.height ? 'primary' : undefined"
            @click="((width = p.width), (height = p.height))"
          >
            {{ $t(`newImage.preset.${p.id}`) }} · {{ p.width }}×{{ p.height }}
          </v-chip>
        </v-chip-group>

        <div class="d-flex ga-3">
          <v-text-field
            v-model.number="width"
            :label="$t('imageSize.width')"
            type="number"
            suffix="px"
            density="compact"
            variant="outlined"
            :rules="rules"
            hide-spin-buttons
          />
          <v-text-field
            v-model.number="height"
            :label="$t('imageSize.height')"
            type="number"
            suffix="px"
            density="compact"
            variant="outlined"
            :rules="rules"
            hide-spin-buttons
          />
        </div>

        <div>
          <div class="label">{{ $t('newImage.background') }}</div>
          <v-btn-toggle
            v-model="background"
            mandatory
            divided
            variant="outlined"
            density="comfortable"
            class="w-100"
          >
            <v-btn
              v-for="bg in ['white', 'color2', 'transparent'] as const"
              :key="bg"
              :value="bg"
              class="flex-1-1"
            >
              <span
                class="swatch"
                :class="`swatch--${bg}`"
                :style="bg === 'transparent' ? undefined : { backgroundColor: fillFor(bg) }"
              />
              {{ $t(`newImage.bg.${bg}`) }}
            </v-btn>
          </v-btn-toggle>
        </div>

        <p class="hint">{{ $t('newImage.undoHint') }}</p>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn @click="ui.newImageOpen = false">{{ $t('imageSize.cancel') }}</v-btn>
        <v-btn color="primary" variant="flat" :disabled="!valid" @click="create">
          {{ $t('newImage.create') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.label {
  margin-bottom: 6px;
  font-size: 0.8125rem;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}
.hint {
  font-size: 0.8125rem;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}
.swatch {
  width: 14px;
  height: 14px;
  margin-inline-end: 6px;
  border-radius: 3px;
  box-shadow: inset 0 0 0 1px rgba(var(--v-border-color), 0.35);
}
.swatch--transparent {
  background: repeating-conic-gradient(#c8c8c8 0% 25%, #ffffff 0% 50%) 50% / 8px 8px;
}
</style>
