import { defineConfig, loadEnv } from 'vite';
import path from 'path';
import electron from 'vite-plugin-electron';
import react from '@vitejs/plugin-react';

// Single Vite config for both Electron dev and browser-only preview.
// Set BROWSER_ONLY=1 to skip the Electron plugin (renderer-only mode for
// WSL without display, CI, or browser-based E2E testing).
// Usage:
//   npm run dev              → Electron app (requires display)
//   BROWSER_ONLY=1 npm run dev  → browser-only renderer at localhost:5173

const browserOnly = process.env.BROWSER_ONLY === '1';

const electronPlugin = browserOnly
  ? []
  : [
      electron([
        {
          entry: path.resolve(__dirname, 'src/main/main.ts'),
          onstart: (options) => {
            if (options.startup) {
              options.startup();
            }
          },
          vite: {
            build: {
              sourcemap: true,
              outDir: 'dist/main',
              rollupOptions: {
                external: ['electron', 'better-sqlite3'],
              },
            },
          },
        },
        {
          entry: path.resolve(__dirname, 'src/preload/preload.ts'),
          onstart: (options) => {
            if (options.reload) {
              options.reload();
            }
          },
          vite: {
            build: {
              sourcemap: true,
              outDir: 'dist/preload',
            },
          },
        },
      ]),
    ];

export default defineConfig({
  plugins: [react(), ...electronPlugin],
  server: {
    port: 5173,
    host: true,
  },
  base: './',
  build: {
    outDir: path.resolve(__dirname, 'dist/renderer'),
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/renderer'),
      '@renderer': path.resolve(__dirname, 'src/renderer'),
    },
  },
});
