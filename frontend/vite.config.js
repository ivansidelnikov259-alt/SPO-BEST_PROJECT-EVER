import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    include: ['src/**/*.test.jsx', 'src/**/*.test.js'],
  },
  server: {
    port: 5173,
    proxy: {
      '/api/groups': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
      '/api/songs': {
        target: 'http://localhost:8002',
        changeOrigin: true,
      },
      '/api/tours': {
        target: 'http://localhost:8003',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'animations': ['framer-motion'],
          'charts': ['recharts'],
          'icons': ['lucide-react'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
    sourcemap: false,
    minify: 'esbuild',
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'axios'],
    exclude: ['framer-motion'],
  },
})