import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['cube4fun-icon.svg', 'vite.svg'],
      manifest: {
        name: 'Cube4fun Competition Analyzer',
        short_name: 'Cube4fun',
        description: 'Analyze Cube4fun WCA competitions: PBs, recent form, trends.',
        theme_color: '#0f1419',
        background_color: '#0f1419',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/cube4fun-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
          },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        // Don't cache API responses; keep data live.
        runtimeCaching: [],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
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
