<script setup lang="ts">
import { mdiBrush, mdiTranslate } from '@mdi/js'
import { useThemeMode, useThemeSync } from '@/composables/useThemeMode'
import { useLocale, useLocaleSync } from '@/composables/useLocale'

useThemeSync()
useLocaleSync()
const { icon, mode, cycle } = useThemeMode()
const { locale } = useLocale()

const toggleLocale = () => (locale.value = locale.value === 'en' ? 'ru' : 'en')
</script>

<template>
  <v-app>
    <v-main class="d-flex align-center justify-center ga-2 bg-workspace">
      <v-btn :prepend-icon="mdiBrush" variant="tonal">{{ $t('app.name') }}</v-btn>
      <v-btn :icon="icon" :aria-label="$t(`theme.${mode}`)" @click="cycle" />
      <v-btn :prepend-icon="mdiTranslate" @click="toggleLocale">{{ locale }}</v-btn>
    </v-main>
  </v-app>
</template>
