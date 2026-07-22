import { defineConfig } from 'vite';
import path from 'path';
import electron from 'vite-plugin-electron';
import react from '@vitejs/plugin-react';

const browserOnly = process.env.BROWSER_ONLY === '1';

const electronPlugin = browserOnly
  ? []
  : [
      electron([
        {
          entry: path.resolve(__dirname, 'src/main_v4.ts'),
          onstart: (options) => {
            if (options.startup) options.startup();
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
          entry: path.resolve(__dirname, 'src/preload_v4/index.ts'),
          onstart: (options) => {
            if (options.reload) options.reload();
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
  server: { port: 5173, host: true },
  base: './',
  build: {
    outDir: path.resolve(__dirname, 'dist/renderer'),
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@domain': path.resolve(__dirname, 'src/domain'),
      '@infrastructure': path.resolve(__dirname, 'src/infrastructure'),
      '@application': path.resolve(__dirname, 'src/application'),
      '@config': path.resolve(__dirname, 'src/config'),
    },
  },
});
