import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { visualizer } from 'rollup-plugin-visualizer';
import Pages from 'vite-plugin-pages';

const isVisualizer = process.env.VITE_VISUALIZER === 'true';

export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
    Pages(),
    isVisualizer && visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,

    }),
  ],
  

  build: {
    chunkSizeWarningLimit: 750,
    rollupOptions: {
      output: {
      },
    },
  },

  preview: {
    port: 4173,
    host: '0.0.0.0',
  },
});
