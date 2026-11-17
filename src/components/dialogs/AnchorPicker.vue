<script setup lang="ts">
import type { Anchor } from '@/engine/resize'

const model = defineModel<Anchor>({ required: true })

const STEPS = [0, 0.5, 1] as const
const NAMES = ['start', 'center', 'end'] as const
</script>

<template>
  <div class="anchor-picker" role="radiogroup" :aria-label="$t('imageSize.anchor')">
    <template v-for="(y, row) in STEPS" :key="row">
      <button
        v-for="(x, col) in STEPS"
        :key="col"
        type="button"
        role="radio"
        class="anchor-picker__cell"
        :class="{ 'anchor-picker__cell--active': model.x === x && model.y === y }"
        :aria-checked="model.x === x && model.y === y"
        :aria-label="$t(`imageSize.anchors.${NAMES[row]}.${NAMES[col]}`)"
        :title="$t(`imageSize.anchors.${NAMES[row]}.${NAMES[col]}`)"
        @click="model = { x, y }"
      />
    </template>
  </div>
</template>

<style scoped>
.anchor-picker {
  display: grid;
  grid-template-columns: repeat(3, 28px);
  gap: 4px;
}
.anchor-picker__cell {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid rgba(var(--v-border-color), 0.24);
  background: transparent;
  cursor: pointer;
  position: relative;
}
.anchor-picker__cell::after {
  content: '';
  position: absolute;
  inset: 11px;
  border-radius: 50%;
  background: rgba(var(--v-theme-on-surface), 0.3);
}
.anchor-picker__cell--active {
  background: rgb(var(--v-theme-primary));
  border-color: rgb(var(--v-theme-primary));
}
.anchor-picker__cell--active::after {
  inset: 9px;
  background: rgb(var(--v-theme-on-primary));
}
.anchor-picker__cell:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}
</style>
