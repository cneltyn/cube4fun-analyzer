import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/cube4fun': {
        target: 'https://cube4fun.pl',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/cube4fun/, '/api'),
      },
      '/api/wca': {
        target: 'https://www.worldcubeassociation.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/wca/, '/api/v0'),
      },
    },
  },
})
