import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['shared/**/*.spec.ts', 'server/**/*.spec.ts'],
    exclude: ['node_modules', 'dist', '.nuxt', '.output'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['shared/**/*.ts', 'server/**/*.ts'],
      exclude: ['node_modules', 'dist', '.nuxt', '.output', '**/*.spec.ts', '**/*.d.ts']
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
      '~': resolve(__dirname, '.'),
      '~~': resolve(__dirname, '.'),
      '@@': resolve(__dirname, '.'),
      assets: resolve(__dirname, './assets'),
      public: resolve(__dirname, './public'),
      '#app': resolve(__dirname, './app')
    }
  }
})
