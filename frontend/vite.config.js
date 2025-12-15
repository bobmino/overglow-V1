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
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react'],
          'utils-vendor': ['axios'],
          // Feature chunks
          'auth': ['./src/context/AuthContext', './src/pages/LoginPage', './src/pages/RegisterPage'],
          'booking': ['./src/pages/BookingPage', './src/pages/CheckoutPage', './src/components/PaymentSelector'],
          'admin': ['./src/pages/AdminDashboardPage', './src/pages/AdminProductsPage', './src/pages/AdminOperatorsPage'],
          'operator': ['./src/pages/OperatorDashboardPage', './src/pages/OperatorProductsPage', './src/pages/OperatorBookingsPage'],
        },
      },
    },
    chunkSizeWarningLimit: 1000, // 1MB
  },
})
