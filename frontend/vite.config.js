import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom', 'react-router-dom'],
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://195.35.36.251:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
    },
  },
});