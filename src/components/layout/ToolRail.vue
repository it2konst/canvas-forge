<script setup lang="ts">
import { TOOL_GROUPS } from '@/tools/catalog'
import { useEditorStore } from '@/stores/editor'

const editor = useEditorStore()
</script>

<template>
  <v-navigation-drawer permanent rail rail-width="56" color="surface">
    <div
      class="tool-rail"
      role="toolbar"
      aria-orientation="vertical"
      :aria-label="$t('panels.tools')"
    >
      <template v-for="(group, index) in TOOL_GROUPS" :key="index">
        <v-divider v-if="index > 0" class="my-1 mx-3" />
        <v-tooltip
          v-for="tool in group"
          :key="tool.id"
          :text="`${$t(`tools.${tool.id}`)} (${tool.shortcut})`"
          location="end"
        >
          <template #activator="{ props: tooltip }">
            <v-btn
              v-bind="tooltip"
              :icon="tool.icon"
              :aria-label="$t(`tools.${tool.id}`)"
              :aria-pressed="editor.activeTool === tool.id"
              :active="editor.activeTool === tool.id"
              :color="editor.activeTool === tool.id ? 'primary' : undefined"
              :variant="editor.activeTool === tool.id ? 'tonal' : 'text'"
              rounded="lg"
              size="small"
              @click="editor.activeTool = tool.id"
            />
          </template>
        </v-tooltip>
      </template>
    </div>
  </v-navigation-drawer>
</template>

<style scoped>
.tool-rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding-block: 8px;
}
</style>
