import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: false,
    watch: {
      ignored: ['**/node_modules/**', '**/dist/**', '**/.git/**']
    },
    hmr: {
      host: '127.0.0.1',
      protocol: 'ws',
      port: 5173,
      clientPort: 5173,
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy) => {
          proxy.on('error', (err, req, res) => {
            console.error(`Proxy error: ${err.message}`);
          });
        },
      },
    },
  },
  build: {
    modulePreload: false,
    rollupOptions: {
      external: (id) => id === 'web-vitals',
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) return 'vendor';
          if (id.includes('/pages/Admin')) return 'admin';
          if (id.includes('/pages/Operator')) return 'operator';
          if (id.includes('/pages/Booking')) return 'checkout';
          if (id.includes('/pages/Login')) return 'auth';
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    minify: 'esbuild',
    cssCodeSplit: true,
  },
})