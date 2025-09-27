import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    target: 'es2020',
    minify: 'esbuild',
    rollupOptions: {
      external: ['@vercel/node'],
      output: {
        entryFileNames: 'js/[name]-[hash].js',
        chunkFileNames: 'js/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      '/api/airtable': {
        target: 'https://api.airtable.com/v0',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/airtable/, ''),
      }
    }
  }
});