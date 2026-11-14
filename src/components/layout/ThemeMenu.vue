<script setup lang="ts">
import { iconCheck } from '@/icons'
import { THEME_ICONS, useThemeMode } from '@/composables/useThemeMode'

const { mode, icon, modes } = useThemeMode()
</script>

<template>
  <v-menu location="bottom end">
    <template #activator="{ props: menu }">
      <v-tooltip :text="$t('theme.label')">
        <template #activator="{ props: tooltip }">
          <v-btn
            v-bind="{ ...menu, ...tooltip }"
            :icon="icon"
            :aria-label="$t('theme.label')"
            size="small"
          />
        </template>
      </v-tooltip>
    </template>

    <v-list density="compact" min-width="180">
      <v-list-item
        v-for="m in modes"
        :key="m"
        :prepend-icon="THEME_ICONS[m]"
        :title="$t(`theme.${m}`)"
        :active="mode === m"
        @click="mode = m"
      >
        <template v-if="mode === m" #append>
          <v-icon :icon="iconCheck" size="small" />
        </template>
      </v-list-item>
    </v-list>
  </v-menu>
</template>
