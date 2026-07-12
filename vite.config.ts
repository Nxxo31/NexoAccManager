import { defineConfig } from 'vite';
import path from 'path';
import electron from 'vite-plugin-electron';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        // Main process entry
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
        // Preload script entry
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
  ],
  root: 'public',
  server: {
    port: 5173,
  },
  build: {
    outDir: path.resolve(__dirname, 'dist/renderer'),
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/renderer'),
    },
  },
});