<script setup lang="ts">
import { useDisplay } from 'vuetify'
import {
  iconGithub,
  iconNew,
  iconOpen,
  iconProperties,
  iconRedo,
  iconImageSize,
  iconSave,
  iconUndo,
} from '@/icons'
import { useUiStore } from '@/stores/ui'
import { useEditorStore } from '@/stores/editor'
import IconAction from './IconAction.vue'
import AppLogo from './AppLogo.vue'
import ThemeMenu from './ThemeMenu.vue'
import LanguageMenu from './LanguageMenu.vue'

const ui = useUiStore()
const editor = useEditorStore()
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

    <!-- File actions are not wired yet: they arrive with the files stage. -->
    <div class="d-flex align-center" role="toolbar" :aria-label="$t('header.file')">
      <IconAction :icon="iconNew" :label="$t('header.new')" shortcut="Ctrl+Alt+N" disabled />
      <IconAction :icon="iconOpen" :label="$t('header.open')" shortcut="Ctrl+O" disabled />
      <IconAction :icon="iconSave" :label="$t('header.save')" shortcut="Ctrl+S" disabled />
      <v-divider vertical inset class="mx-1" />
      <IconAction
        :icon="iconUndo"
        :label="$t('header.undo')"
        shortcut="Ctrl+Z"
        :disabled="!editor.canUndo"
        @click="editor.undo"
      />
      <IconAction
        :icon="iconRedo"
        :label="$t('header.redo')"
        shortcut="Ctrl+Y"
        :disabled="!editor.canRedo"
        @click="editor.redo"
      />
      <template v-if="!xs">
        <v-divider vertical inset class="mx-1" />
        <IconAction
          :icon="iconImageSize"
          :label="$t('imageSize.title')"
          shortcut="Ctrl+E"
          @click="ui.imageSizeOpen = true"
        />
      </template>
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
