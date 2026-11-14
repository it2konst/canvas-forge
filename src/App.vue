<script setup lang="ts">
import { mdiBrush } from '@mdi/js'
import { useThemeMode, useThemeSync } from '@/composables/useThemeMode'

useThemeSync()
const { icon, mode, cycle } = useThemeMode()
</script>

<template>
  <v-app>
    <v-main class="d-flex align-center justify-center ga-2 bg-workspace">
      <v-btn :prepend-icon="mdiBrush" variant="tonal">canvas-forge</v-btn>
      <v-btn :icon="icon" :aria-label="mode" @click="cycle" />
    </v-main>
  </v-app>
</template>
