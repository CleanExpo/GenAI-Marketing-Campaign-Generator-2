import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
    return {
      plugins: [react()],
      build: {
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: false,
        rollupOptions: {
          output: {
            manualChunks: undefined
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
            configure: (proxy, _options) => {
              proxy.on('error', (err, _req, _res) => {
                console.log('Airtable proxy error:', err);
              });
            }
          }
        }
      }
    };
});
