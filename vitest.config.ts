import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['**/*.test.ts', '**/*.test.tsx'],
    env: {
      DATABASE_URL: 'postgres://test'
    }
  },
  resolve: {
    alias: {
      '@shared': new URL('./shared', import.meta.url).pathname,
      '@': new URL('./client/src', import.meta.url).pathname
    }
  }
})
