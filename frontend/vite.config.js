import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
    },
  },
  build: {
    // Disable inline module preload (prevents data URI issues)
    modulePreload: {
      polyfill: false,
    },
    rollupOptions: {
      // Externalize packages that shouldn't be bundled
      external: (id) => {
        // Don't bundle web-vitals if not installed
        if (id === 'web-vitals') {
          return true;
        }
        return false;
      },
      output: {
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            // Keep lucide-react with react-vendor to avoid undefined errors
            // Don't separate it into ui-vendor as it needs React context
            if (id.includes('axios') || id.includes('i18next')) {
              return 'utils-vendor';
            }
            if (id.includes('recharts')) {
              return 'charts-vendor';
            }
            // Other node_modules (including lucide-react)
            return 'vendor';
          }
          
          // Feature chunks
          if (id.includes('/pages/Admin') || id.includes('/pages/Admin')) {
            return 'admin';
          }
          if (id.includes('/pages/Operator')) {
            return 'operator';
          }
          if (id.includes('/pages/Booking') || id.includes('/pages/Checkout')) {
            return 'booking';
          }
          if (id.includes('/pages/Login') || id.includes('/pages/Register')) {
            return 'auth';
          }
        },
        // Optimize chunk names
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/img/[name]-[hash][extname]`;
          }
          if (/woff2?|eot|ttf|otf/i.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[ext]/[name]-[hash][extname]`;
        },
      },
    },
    chunkSizeWarningLimit: 1000, // 1MB
    minify: 'esbuild', // Use esbuild (default, faster than terser)
    // Note: To use terser, install it: npm install -D terser
    // Then change minify to 'terser' and uncomment terserOptions below
    // terserOptions: {
    //   compress: {
    //     drop_console: true,
    //     drop_debugger: true,
    //   },
    // },
    // Enable source maps for production debugging (optional)
    sourcemap: false,
    // Optimize CSS
    cssCodeSplit: true,
    cssMinify: true,
  },
})
