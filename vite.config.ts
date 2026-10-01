import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'TeslaHub.ge — Tesla Parts & POS',
        short_name: 'TeslaHub.ge',
        description: 'Tesla parts store, catalogue and point of sale',
        lang: 'ka',
        theme_color: '#0d0d0d',
        background_color: '#0d0d0d',
        display: 'standalone',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Never let the service worker touch the API: sales, stock and auth
        // must always hit the server. Workbox leaves non-precached requests
        // to the network by default; the denylist keeps /api out of the SPA
        // navigation fallback as well.
        navigateFallbackDenylist: [/\/api\//],
        globPatterns: ['**/*.{js,css,html,svg,png}'],
        // Staff/admin/POS screens and the order-PDF libraries are lazy chunks a
        // shopper rarely or never needs — don't make every visitor's service
        // worker download them up front. They still load on demand from the
        // network when those screens are opened.
        globIgnores: [
          '**/node_modules/**',
          'assets/Admin-*',
          'assets/Staff-*',
          'assets/ImageTool-*',
          'assets/imageProcess-*',
          'assets/orderPdf-*',
          'assets/html2canvas*',
          'assets/index.es-*',
          'assets/purify*',
        ],
        runtimeCaching: [
          {
            // Catalog content: network-first so online users always get fresh
            // data, but a cached copy lets the installed PWA still show the
            // catalogue offline. Only content.php — sales/auth/stock stay
            // strictly network-only (never cached).
            urlPattern: ({ url }: { url: URL }) => url.pathname.endsWith('/api/content.php'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'thub-content',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 4, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
        ],
      },
    }),
  ],
  base: '/thub-ge/',
})
