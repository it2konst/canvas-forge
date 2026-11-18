<script setup lang="ts">
import { iconOpen } from '@/icons'

defineProps<{ active: boolean }>()
</script>

<template>
  <Transition name="fade">
    <div v-if="active" class="drop-overlay" aria-hidden="true">
      <div class="drop-overlay__card">
        <v-icon :icon="iconOpen" size="40" color="primary" />
        <div class="drop-overlay__title">{{ $t('files.dropTitle') }}</div>
        <div class="drop-overlay__hint">{{ $t('files.dropHint') }}</div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.drop-overlay {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(var(--v-theme-background), 0.7);
  backdrop-filter: blur(2px);
  /* The drop lands on the window, not on this layer. */
  pointer-events: none;
}
.drop-overlay__card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px 48px;
  border: 2px dashed rgb(var(--v-theme-primary));
  border-radius: 16px;
  background: rgb(var(--v-theme-surface));
  text-align: center;
}
.drop-overlay__title {
  font-size: 1.125rem;
  font-weight: 600;
}
.drop-overlay__hint {
  font-size: 0.875rem;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .fade-enter-active,
  .fade-leave-active {
    transition: none;
  }
}
</style>
