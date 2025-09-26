import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api/airtable': {
            target: 'https://api.airtable.com/v0',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api\/airtable/, ''),
            headers: {
              'User-Agent': 'ZENITH-CRM-Integration/1.0'
            }
          }
        }
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
