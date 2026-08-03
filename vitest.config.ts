// Vitest configuration — NexoAccManager
// Restauración Mes 1 (PROJECT.md): harness de unit tests sobre arquitectura hexagonal.
//
// NOTA: vitest NO está aún en devDependencies. Este archivo es inerte hasta que
// se ejecute `npm i -D vitest`. Cuando se instale, `npx vitest run` levanta esta config.
// Los tests viven en tests/unit/** y NO están en tsconfig.json#include (solo src/**),
// así que `tsc --noEmit` no intenta compilarlos — vitest los transpila aparte con esbuild.

import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@domain': resolve(__dirname, 'src/domain'),
      '@infrastructure': resolve(__dirname, 'src/infrastructure'),
      '@application': resolve(__dirname, 'src/application'),
      '@config': resolve(__dirname, 'src/config'),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    setupFiles: ['./vitest.setup.ts'],
    globals: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: 'coverage',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.d.ts', 'src/preload/**', 'src/main.ts', 'src/renderer.tsx'],
    },
  },
});
