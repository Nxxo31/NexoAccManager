import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      reportsDirectory: './coverage',
      include: [
        'src/infrastructure/services/**/*.ts',
        'src/infrastructure/database/**/*.ts',
        'src/infrastructure/external/LocalApiService.ts',
        'src/infrastructure/external/CryptoService.ts',
      ],
      exclude: ['**/*.test.ts', '**/*.d.ts', 'src/main.ts'],
    },
  },
})