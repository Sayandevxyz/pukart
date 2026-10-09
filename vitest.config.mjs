import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    env: {
      GOOGLE_CLIENT_ID: 'mock-google-client-id-test.apps.googleusercontent.com',
      GOOGLE_CLIENT_SECRET: 'mock-google-client-secret-test',
      BETTER_AUTH_SECRET: 'pukart_secure_campus_marketplace_secret_2026_pondicherry_university',
      BETTER_AUTH_URL: 'http://localhost:3000',
      VITE_CONFIG_NATIVE_IGNORE_WARNING: 'true',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['lib/constants/**', 'lib/ai.ts', 'lib/auth.ts', 'lib/utils.ts'],
      exclude: ['**/*.d.ts', 'node_modules/**'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), './'),
    },
  },
})
