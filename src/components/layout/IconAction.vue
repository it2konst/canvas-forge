<script setup lang="ts">
/** Icon-only button with a tooltip that doubles as its accessible name. */
defineProps<{
  icon: string
  label: string
  shortcut?: string
  disabled?: boolean
}>()

defineEmits<{ click: [event: MouseEvent] }>()
</script>

<template>
  <v-tooltip :text="shortcut ? `${label} (${shortcut})` : label">
    <template #activator="{ props: tooltip }">
      <!-- The wrapper keeps the tooltip working while the button is disabled. -->
      <span v-bind="tooltip">
        <v-btn
          :icon="icon"
          :aria-label="label"
          :disabled="disabled"
          size="small"
          @click="$emit('click', $event)"
        />
      </span>
    </template>
  </v-tooltip>
</template>
