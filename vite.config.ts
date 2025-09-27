import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
    return {
      plugins: [
        react({
          // Enable React Fast Refresh
          fastRefresh: true,
          // Optimize JSX runtime
          jsxRuntime: 'automatic'
        })
      ],
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
        target: 'es2020',
        minify: 'terser',
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true,
            pure_funcs: ['console.log', 'console.debug'],
            passes: 2
          },
          mangle: {
            safari10: true
          }
        },
        chunkSizeWarningLimit: 600, // Reduced from 1000 to 600KB
        rollupOptions: {
          external: ['@vercel/node'],
          output: {
            // Optimized chunk strategy
            manualChunks: (id) => {
              // Vendor chunks with size optimization
              if (id.includes('node_modules')) {
                if (id.includes('react') || id.includes('react-dom')) {
                  return 'react-vendor';
                }
                if (id.includes('@google/genai')) {
                  return 'ai-vendor';
                }
                if (id.includes('jspdf')) {
                  return 'pdf-vendor';
                }
                // Group smaller vendor libs together
                return 'vendor';
              }

              // Component-based chunking
              if (id.includes('/components/')) {
                if (id.includes('CampaignManager') || id.includes('ExportManager')) {
                  return 'campaign-features';
                }
                if (id.includes('StaffManager') || id.includes('ProjectManager') || id.includes('BrandKitManager')) {
                  return 'enterprise-features';
                }
                if (id.includes('CRMManager')) {
                  return 'crm-features';
                }
                // Core components stay in main bundle
                return 'components';
              }

              // Service-based chunking
              if (id.includes('/services/')) {
                if (id.includes('geminiService') || id.includes('semrushService')) {
                  return 'core-services';
                }
                if (id.includes('exportService')) {
                  return 'export-services';
                }
                return 'business-services';
              }
            },
            // Optimize chunk naming for caching
            chunkFileNames: (chunkInfo) => {
              const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
              return `js/[name]-[hash].js`;
            },
            entryFileNames: 'js/[name]-[hash].js',
            assetFileNames: 'assets/[name]-[hash].[ext]'
          },
          // Tree shaking optimization
          treeshake: {
            moduleSideEffects: false,
            propertyReadSideEffects: false,
            unknownGlobalSideEffects: false
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
