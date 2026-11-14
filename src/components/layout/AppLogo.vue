<template>
  <svg class="app-logo" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
    <rect width="32" height="32" rx="8" class="app-logo__bg" />
    <path
      d="M8 22c3-1 4-4 6-6s5-3 7-6"
      fill="none"
      class="app-logo__stroke"
      stroke-width="3"
      stroke-linecap="round"
    />
    <circle cx="23" cy="9" r="2.5" fill="#FFC90E" />
  </svg>
</template>

<style scoped>
.app-logo {
  width: 28px;
  height: 28px;
  flex: none;
}
.app-logo__bg {
  fill: rgb(var(--v-theme-primary));
}
.app-logo__stroke {
  stroke: rgb(var(--v-theme-on-primary));
}
</style>
