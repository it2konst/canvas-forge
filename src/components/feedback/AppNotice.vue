<script setup lang="ts">
import { computed } from 'vue'
import { useNotificationsStore } from '@/stores/notifications'

const notifications = useNotificationsStore()

const open = computed({
  get: () => notifications.current !== null,
  set: (value) => {
    if (!value) notifications.dismiss()
  },
})
</script>

<template>
  <v-snackbar
    :key="notifications.current?.id"
    v-model="open"
    :timeout="notifications.current?.kind === 'error' ? 6000 : 4000"
    :color="notifications.current?.kind === 'error' ? 'error' : undefined"
    location="bottom"
    :role="notifications.current?.kind === 'error' ? 'alert' : 'status'"
  >
    {{ notifications.current?.text }}
    <template #actions>
      <v-btn variant="text" @click="notifications.dismiss()">{{ $t('notice.close') }}</v-btn>
    </template>
  </v-snackbar>
</template>
