import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
    return {
      plugins: [react()],
      define: {
        global: 'globalThis',
      },
      resolve: {
        alias: {
          // Prevent Node.js modules from being bundled
          '@vercel/node': false,
        }
      },
      build: {
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: false,
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
          external: ['@vercel/node'],
          output: {
            manualChunks: {
              // React and React DOM in their own chunk
              'react-vendor': ['react', 'react-dom'],

              // AI services in their own chunk
              'ai-services': ['@google/genai'],

              // Large third-party libraries
              'pdf-vendor': ['jspdf'],

              // Components - split by feature area
              'campaign-components': [
                './components/CampaignManager',
                './components/ExportManager'
              ],
              'management-components': [
                './components/StaffManager',
                './components/ProjectManager',
                './components/BrandKitManager'
              ],
              'crm-components': [
                './components/CRMManager'
              ],

              // Services - split by domain
              'core-services': [
                './services/geminiService',
                './services/semrushService'
              ],
              'business-services': [
                './services/airtableService',
                './services/authService',
                './services/crmIntegration',
                './services/campaignStorage',
                './services/brandKitService',
                './services/exportService'
              ]
            }
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
