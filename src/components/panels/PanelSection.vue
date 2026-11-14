<script setup lang="ts">
defineProps<{ title: string; icon?: string }>()
</script>

<template>
  <section class="panel-section">
    <h2 class="panel-section__title">
      <v-icon v-if="icon" :icon="icon" size="16" />
      {{ title }}
    </h2>
    <slot />
  </section>
</template>

<style scoped>
.panel-section {
  padding: 12px 16px 16px;
}
.panel-section + .panel-section {
  border-top: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.panel-section__title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}
</style>
