<script setup lang="ts">
import { iconCheck, iconLanguage } from '@/icons'
import { useLocale } from '@/composables/useLocale'

const { locale, locales, names } = useLocale()
</script>

<template>
  <v-menu location="bottom end">
    <template #activator="{ props: menu }">
      <v-tooltip :text="$t('language.label')">
        <template #activator="{ props: tooltip }">
          <v-btn
            v-bind="{ ...menu, ...tooltip }"
            :icon="iconLanguage"
            :aria-label="$t('language.label')"
            size="small"
          />
        </template>
      </v-tooltip>
    </template>

    <v-list density="compact" min-width="160">
      <v-list-item
        v-for="l in locales"
        :key="l"
        :title="names[l]"
        :lang="l"
        :active="locale === l"
        @click="locale = l"
      >
        <template v-if="locale === l" #append>
          <v-icon :icon="iconCheck" size="small" />
        </template>
      </v-list-item>
    </v-list>
  </v-menu>
</template>
