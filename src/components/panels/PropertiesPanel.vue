<script setup lang="ts">
import { computed } from 'vue'
import { useDisplay } from 'vuetify'
import { iconLayers, iconBrush } from '@/icons'
import { useEditorStore } from '@/stores/editor'
import { useUiStore } from '@/stores/ui'
import PanelSection from './PanelSection.vue'
import ColorPanel from './ColorPanel.vue'

const editor = useEditorStore()
const ui = useUiStore()
const { smAndDown } = useDisplay()

// Docked on wide screens, a sliding drawer on tablets and phones.
const open = computed({
  get: () => !smAndDown.value || ui.propertiesOpen,
  set: (value) => (ui.propertiesOpen = value),
})
</script>

<template>
  <v-navigation-drawer
    v-model="open"
    location="end"
    width="272"
    :temporary="smAndDown"
    :permanent="!smAndDown"
    color="surface"
    :aria-label="$t('panels.properties')"
    tag="aside"
  >
    <PanelSection :title="$t('panels.colors')">
      <ColorPanel />
    </PanelSection>

    <PanelSection :title="$t('panels.brush')" :icon="iconBrush">
      <v-slider
        v-model="editor.brushSize"
        :min="1"
        :max="100"
        :step="1"
        :label="$t('brush.size')"
        color="primary"
        density="compact"
        hide-details
        thumb-label
      >
        <template #append>
          <span class="value">{{ editor.brushSize }}&nbsp;px</span>
        </template>
      </v-slider>
    </PanelSection>

    <PanelSection :title="$t('panels.layers')" :icon="iconLayers">
      <p class="placeholder">{{ $t('panels.comingSoon') }}</p>
    </PanelSection>
  </v-navigation-drawer>
</template>

<style scoped>
.value {
  min-width: 48px;
  text-align: end;
  font-family: var(--cf-font-mono);
  font-size: 0.8125rem;
}
.placeholder {
  font-size: 0.8125rem;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}
</style>
