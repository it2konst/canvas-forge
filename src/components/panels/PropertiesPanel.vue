<script setup lang="ts">
import { computed } from 'vue'
import { useDisplay } from 'vuetify'
import { iconLayers } from '@/icons'
import { toolById } from '@/tools/catalog'
import { useEditorStore } from '@/stores/editor'
import { useUiStore } from '@/stores/ui'
import PanelSection from './PanelSection.vue'
import ColorPanel from './ColorPanel.vue'
import ToolOptions from './ToolOptions.vue'

const editor = useEditorStore()
const ui = useUiStore()
const { smAndDown } = useDisplay()

const tool = computed(() => toolById(editor.activeTool))

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

    <PanelSection :title="$t(`tools.${tool.id}`)" :icon="tool.icon">
      <ToolOptions />
    </PanelSection>

    <PanelSection :title="$t('panels.layers')" :icon="iconLayers">
      <p class="placeholder">{{ $t('panels.comingSoon') }}</p>
    </PanelSection>
  </v-navigation-drawer>
</template>

<style scoped>
.placeholder {
  font-size: 0.8125rem;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}
</style>
