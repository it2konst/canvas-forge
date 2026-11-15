import { fileURLToPath } from 'node:url'
import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'node',
      root: fileURLToPath(new URL('./', import.meta.url)),
      include: ['src/**/*.test.ts'],
      coverage: {
        include: ['src/engine/**'],
        reporter: ['text', 'html'],
      },
    },
  }),
)
