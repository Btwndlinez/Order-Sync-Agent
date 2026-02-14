import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dns from 'node:dns';

dns.setDefaultResultOrder('verbatim');

export default defineConfig({
  plugins: [react()],
  // CRITICAL: This matches your GitHub repo name exactly
  base: '/Order-Sync-Agent/',
  root: './website',
  build: {
    outDir: './dist-website',
    emptyOutDir: true,
    assetsInlineLimit: 0,
  },
  server: {
    port: 5173,
    strictPort: true,
    host: 'localhost',
    hmr: {
      overlay: true,
    },
    watch: {
      usePolling: true,
      interval: 100,
    },
  },
  optimizeDeps: {
    force: true,
  },
  publicDir: 'public',
});
