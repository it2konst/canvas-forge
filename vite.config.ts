import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // Tree-shakes Vuetify: only components that are actually used get bundled.
    vuetify({ autoImport: true }),
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
