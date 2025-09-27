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
      external: (id) => {
        // Externalize all Rollup platform-specific dependencies
        if (id.includes('@rollup/rollup-')) {
          return true;
        }
        return false;
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