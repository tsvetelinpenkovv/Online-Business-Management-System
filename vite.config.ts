import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'placeholder.svg'],
      manifest: {
        name: 'Система за управление',
        short_name: 'OBM System',
        description: 'Управление на поръчки, склад и финанси',
        theme_color: '#3b82f6',
        background_color: '#f5f7fa',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        icons: [
          { src: '/favicon.ico', sizes: '64x64', type: 'image/x-icon' },
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Force new service worker to take control immediately
        skipWaiting: true,
        clientsClaim: true,
        // Clean up old caches from previous versions
        cleanupOutdatedCaches: true,
        // Only cache static assets, not HTML (HTML should always be fresh)
        globPatterns: ['**/*.{js,css,ico,png,svg,woff2}'],
        // Don't cache navigation requests - always fetch fresh HTML
        navigateFallback: null,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts', expiration: { maxEntries: 10, maxAgeSeconds: 365 * 24 * 60 * 60 } },
          },
          {
            // Never cache Supabase API calls
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkOnly',
          },
          {
            // Never cache edge functions
            urlPattern: /\/functions\/v1\/.*/i,
            handler: 'NetworkOnly',
          },
        ],
        // Exclude preview/auth URLs from SW scope
        navigateFallbackDenylist: [/^\/~oauth/, /\?__lovable_token=/, /auth-bridge/],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
