<script setup lang="ts">
import { useDisplay } from 'vuetify'
import {
  iconGithub,
  iconNew,
  iconOpen,
  iconProperties,
  iconRedo,
  iconSave,
  iconUndo,
} from '@/icons'
import { useUiStore } from '@/stores/ui'
import IconAction from './IconAction.vue'
import AppLogo from './AppLogo.vue'
import ThemeMenu from './ThemeMenu.vue'
import LanguageMenu from './LanguageMenu.vue'

const ui = useUiStore()
const { smAndDown, xs } = useDisplay()

const REPO_URL = 'https://github.com/it2konst/canvas-forge'
</script>

<template>
  <v-app-bar density="compact" flat border="b" color="surface">
    <div class="d-flex align-center ga-2" :class="xs ? 'px-2' : 'px-3'">
      <AppLogo />
      <span v-if="!xs" class="app-title">{{ $t('app.name') }}</span>
    </div>

    <v-divider v-if="!xs" vertical inset class="mx-1" />

    <!-- Not wired yet: file and history actions arrive with the drawing engine. -->
    <div class="d-flex align-center" role="toolbar" :aria-label="$t('header.file')">
      <IconAction :icon="iconNew" :label="$t('header.new')" shortcut="Ctrl+Alt+N" disabled />
      <IconAction :icon="iconOpen" :label="$t('header.open')" shortcut="Ctrl+O" disabled />
      <IconAction :icon="iconSave" :label="$t('header.save')" shortcut="Ctrl+S" disabled />
      <v-divider vertical inset class="mx-1" />
      <IconAction :icon="iconUndo" :label="$t('header.undo')" shortcut="Ctrl+Z" disabled />
      <IconAction :icon="iconRedo" :label="$t('header.redo')" shortcut="Ctrl+Y" disabled />
    </div>

    <v-spacer />

    <v-btn
      v-if="!xs"
      :href="REPO_URL"
      target="_blank"
      rel="noopener"
      :icon="iconGithub"
      :aria-label="$t('header.source')"
      size="small"
    />
    <LanguageMenu />
    <ThemeMenu />
    <v-btn
      v-if="smAndDown"
      :icon="iconProperties"
      :aria-label="$t('panels.properties')"
      :active="ui.propertiesOpen"
      size="small"
      @click="ui.propertiesOpen = !ui.propertiesOpen"
    />
  </v-app-bar>
</template>

<style scoped>
.app-title {
  font-weight: 600;
  letter-spacing: -0.01em;
}
</style>
