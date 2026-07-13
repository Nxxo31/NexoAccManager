import { defineConfig } from 'vite';
import path from 'path';
import react from '@vitejs/plugin-react';

// Config temporal para servir solo el renderer en el navegador
// sin arrancar Electron — para testing de UI
export default defineConfig({
  plugins: [
    react(),
  ],
  server: {
    port: 5174,
    host: true,
  },
  base: './',
  root: '.',
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
