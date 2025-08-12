import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/socket.io': {
        target: process.env.VITE_SERVER_URL || 'http://localhost:3001',
        ws: true,
      },
    },
  },
})