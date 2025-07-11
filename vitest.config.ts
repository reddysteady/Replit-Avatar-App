import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/*.test.ts', '**/*.test.tsx'],
    env: {
      SUPABASE_DATABASE_URL: 'postgres://test'
    }
  },
  resolve: {
    alias: {
      '@shared': new URL('./shared', import.meta.url).pathname,
      '@': new URL('./client/src', import.meta.url).pathname
    }
  }
})
