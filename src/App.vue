<script setup lang="ts">
import { useThemeSync } from '@/composables/useThemeMode'
import { useLocaleSync } from '@/composables/useLocale'
import { useShortcuts } from '@/composables/useShortcuts'
import AppHeader from '@/components/layout/AppHeader.vue'
import StatusBar from '@/components/layout/StatusBar.vue'
import ToolRail from '@/components/layout/ToolRail.vue'
import CanvasViewport from '@/components/layout/CanvasViewport.vue'
import PropertiesPanel from '@/components/panels/PropertiesPanel.vue'
import ImageSizeDialog from '@/components/dialogs/ImageSizeDialog.vue'
import NewImageDialog from '@/components/dialogs/NewImageDialog.vue'
import AppNotice from '@/components/feedback/AppNotice.vue'
import DropOverlay from '@/components/feedback/DropOverlay.vue'
import { useFileDropAndPaste } from '@/composables/useFileDropAndPaste'

useThemeSync()
useLocaleSync()
useShortcuts()
const { dragging } = useFileDropAndPaste()
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
    <ImageSizeDialog />
    <NewImageDialog />
    <AppNotice />
    <DropOverlay :active="dragging" />
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
