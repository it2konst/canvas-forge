<script setup lang="ts">
import { computed } from 'vue'
import { iconFit, iconZoomIn, iconZoomOut } from '@/icons'
import { MAX_ZOOM, MIN_ZOOM } from '@/engine/view'
import { useViewStore } from '@/stores/view'

const view = useViewStore()
const PRESETS = [0.25, 0.5, 1, 2, 4, 8, 16]

const percent = (zoom: number) => `${Math.round(zoom * 100)}%`
const label = computed(() => percent(view.zoom))
</script>

<template>
  <div class="zoom-control">
    <v-btn
      :icon="iconZoomOut"
      size="x-small"
      density="comfortable"
      :disabled="view.zoom <= MIN_ZOOM"
      :aria-label="$t('zoom.out')"
      :title="`${$t('zoom.out')} (Ctrl+-)`"
      @click="view.zoomOut()"
    />
    <v-menu location="top end">
      <template #activator="{ props: menu }">
        <v-btn
          v-bind="menu"
          size="x-small"
          variant="text"
          class="zoom-value"
          :aria-label="`${$t('status.zoom')}: ${label}`"
        >
          {{ label }}
        </v-btn>
      </template>
      <v-list density="compact" min-width="200">
        <v-list-item
          :prepend-icon="iconFit"
          :title="$t('zoom.fit')"
          :active="view.fitting"
          @click="view.fit()"
        >
          <template #append><kbd>Ctrl+0</kbd></template>
        </v-list-item>
        <v-list-item :title="$t('zoom.actual')" @click="view.actualSize()">
          <template #append><kbd>Ctrl+1</kbd></template>
        </v-list-item>
        <v-divider class="my-1" />
        <v-list-item
          v-for="z in PRESETS"
          :key="z"
          :title="percent(z)"
          :active="!view.fitting && Math.abs(view.zoom - z) < 1e-6"
          @click="view.zoomTo(z)"
        />
      </v-list>
    </v-menu>
    <v-btn
      :icon="iconZoomIn"
      size="x-small"
      density="comfortable"
      :disabled="view.zoom >= MAX_ZOOM"
      :aria-label="$t('zoom.in')"
      :title="`${$t('zoom.in')} (Ctrl+=)`"
      @click="view.zoomIn()"
    />
  </div>
</template>

<style scoped>
.zoom-control {
  display: flex;
  align-items: center;
}
.zoom-value {
  min-width: 56px;
  font-family: var(--cf-font-mono);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0;
}
kbd {
  font-family: var(--cf-font-mono);
  font-size: 0.75rem;
  opacity: 0.7;
}
</style>
