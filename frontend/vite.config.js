import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
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
})