import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.{test,spec}.ts'],
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
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
      thresholds: {
        lines: 95,
        branches: 95,
        functions: 95,
        statements: 95,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), './'),
    },
  },
})
