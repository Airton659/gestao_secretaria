import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const base = process.env.VITE_BASE_PATH ?? '/';

export default defineConfig({
  base,
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    watch: { usePolling: true },
    proxy: {
      '/api': {
        target: process.env.API_URL ?? 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
