<script setup lang="ts">
import { useThemeSync } from '@/composables/useThemeMode'
import { useLocaleSync } from '@/composables/useLocale'
import { useShortcuts } from '@/composables/useShortcuts'
import AppHeader from '@/components/layout/AppHeader.vue'
import StatusBar from '@/components/layout/StatusBar.vue'
import ToolRail from '@/components/layout/ToolRail.vue'
import CanvasViewport from '@/components/layout/CanvasViewport.vue'
import PropertiesPanel from '@/components/panels/PropertiesPanel.vue'

useThemeSync()
useLocaleSync()
useShortcuts()
</script>

<template>
  <v-app>
    <!-- Order matters: header and status bar span the full width, panels fit between. -->
    <AppHeader />
    <StatusBar />
    <ToolRail />
    <PropertiesPanel />
    <v-main class="app-main">
      <div class="app-main__content">
        <CanvasViewport />
      </div>
    </v-main>
  </v-app>
</template>

<style scoped>
/* The editor fills exactly one screen; only the canvas area scrolls or pans. */
.app-main {
  height: 100dvh;
}
.app-main__content {
  position: relative;
  height: 100%;
}
</style>
