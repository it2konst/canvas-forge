<script setup lang="ts">
import { iconUpdate } from '@/icons'
import { useAppUpdate } from '@/composables/useAppUpdate'

const { needRefresh, update, later } = useAppUpdate()
</script>

<template>
  <!-- Stays until the user decides: no timeout, no forced reload. -->
  <v-snackbar
    :model-value="needRefresh"
    :timeout="-1"
    location="bottom end"
    role="status"
    multi-line
  >
    <div class="d-flex align-center ga-3">
      <v-icon :icon="iconUpdate" color="primary" />
      <div>
        <div class="font-weight-medium">{{ $t('pwa.updateTitle') }}</div>
        <div class="text-body-2 text-medium-emphasis">{{ $t('pwa.updateHint') }}</div>
      </div>
    </div>
    <template #actions>
      <v-btn variant="text" @click="later">{{ $t('pwa.later') }}</v-btn>
      <v-btn color="primary" variant="flat" @click="update">{{ $t('pwa.update') }}</v-btn>
    </template>
  </v-snackbar>
</template>
