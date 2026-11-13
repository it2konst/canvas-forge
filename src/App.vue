<script setup lang="ts">
import { mdiBrush } from '@mdi/js'
</script>

<template>
  <v-app>
    <v-main class="d-flex align-center justify-center">
      <v-btn :prepend-icon="mdiBrush" variant="tonal">canvas-forge</v-btn>
    </v-main>
  </v-app>
</template>
