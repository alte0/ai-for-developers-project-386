import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// В compose web получает API_URL=http://api:${PORT}; локально без Docker
// можно запустить с API_URL=http://localhost:3000.
const apiUrl = process.env.API_URL ?? 'http://api:3000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': apiUrl,
    },
  },
})
