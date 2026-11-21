import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // Tree-shakes Vuetify: only components that are actually used get bundled.
    vuetify({ autoImport: true }),
    // Offline support: every built file is precached by a Workbox service
    // worker. Updates wait for the user (see useAppUpdate), never forced.
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      // The manifest is a plain file in public/, easy to read and edit.
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,webmanifest}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        // The first visit is controlled at once, so later updates can take over cleanly.
        clientsClaim: true,
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
    }),
  ],
  build: {
    // Small font subsets would be inlined as data: URIs, which the strict
    // CSP (font-src 'self') blocks. Keep fonts as real files.
    assetsInlineLimit: (file) => (/\.woff2?$/.test(file) ? false : undefined),
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
