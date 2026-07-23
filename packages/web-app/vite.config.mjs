import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import { compression } from 'vite-plugin-compression2';
import { visualizer } from 'rollup-plugin-visualizer';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    // SVG imported with `?react` becomes a React component; a bare `.svg`
    // import stays a URL (keeps src/assets/icons/index.js working untouched).
    svgr(),
    compression({ algorithm: 'gzip' }),
    compression({ algorithm: 'brotliCompress', deleteOriginalAssets: false }),
    visualizer({ filename: 'dist/stats.html', gzipSize: true, brotliSize: true }),
    // PWA / Service Worker (Workbox under the hood). Required to package the
    // app as an Android TWA. SW is registered manually in src/index.jsx.
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      // Keep the historical manifest filename so the existing twa-manifest.json
      // (webManifestUrl: .../manifest.json) stays valid. (Service worker stays
      // the default sw.js.)
      manifestFilename: 'manifest.json',
      includeAssets: ['favicon.ico', 'logo.svg', 'apple-touch-icon.png'],
      manifest: {
        id: '/',
        short_name: 'Grottocenter',
        name: 'Grottocenter',
        description: 'The Wiki database made by cavers for cavers.',
        scope: '/',
        start_url: '/',
        display: 'standalone',
        theme_color: '#5d4037',
        background_color: '#5d4037',
        icons: [
          { src: 'logo192.png', type: 'image/png', sizes: '192x192' },
          { src: 'logo512.png', type: 'image/png', sizes: '512x512' },
          {
            src: 'logo512-maskable.png',
            type: 'image/png',
            sizes: '512x512',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        // Precache lang/*.json too — otherwise the initial locale fetch in
        // index.html fails offline and blocks the loader from clearing.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2,json}'],
        // stats.html is the bundle-analysis report (visualizer), ~8 MB — never
        // precache it. Also keep the gzip/brotli copies out of the precache.
        globIgnores: ['**/stats.html', '**/*.{gz,br}'],
        // Take control of the page on the very first load so offline works
        // from the first visit (matches the previous CRA SW's clientsClaim()).
        clientsClaim: true,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/, /^\/\.well-known/],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // OpenStreetMap basemap tiles (default Leaflet layer).
            urlPattern: ({ url }) => /tile\.openstreetmap\.org/.test(url.href),
            handler: 'CacheFirst',
            options: {
              cacheName: 'osm-tiles',
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            // OpenTopoMap basemap tiles — separate cache so switching basemaps
            // doesn't evict the other's offline area, and to allow a longer TTL
            // (OpenTopoMap updates less often / stricter usage policy).
            // WMS/WMTS layers are intentionally left out of the precache.
            urlPattern: ({ url }) => /tile\.opentopomap\.org/.test(url.href),
            handler: 'CacheFirst',
            options: {
              cacheName: 'opentopomap-tiles',
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 90 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            // Google Fonts (stylesheets + font files).
            urlPattern: ({ url }) =>
              url.origin === 'https://fonts.googleapis.com' ||
              url.origin === 'https://fonts.gstatic.com',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 20 }
            }
          },
          {
            // /lang/*.json — also covered by precache, but the runtime rule
            // lets new translations reach the app without a SW rebuild.
            urlPattern: ({ url, sameOrigin }) =>
              sameOrigin && /^\/lang\/[^/]+\.json$/.test(url.pathname),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'lang',
              expiration: { maxEntries: 30 }
            }
          }
        ]
      },
      // No SW in dev — avoids confusing cache behaviour while developing.
      devOptions: { enabled: false }
    })
  ],
  resolve: {
    alias: [
      { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
      // leaflet-draw is a side-effect-only CJS plugin with no default export;
      // the shim runs the side effect and provides a default for consumers
      // (react-leaflet-draw) so Rolldown can resolve the import. Exact match
      // (regex) so the shim's own deep import of the real file is not aliased.
      {
        find: /^leaflet-draw$/,
        replacement: fileURLToPath(
          new URL('./src/shims/leaflet-draw.js', import.meta.url)
        )
      }
    ]
  },
  server: {
    port: 3000,
    // Listen on all interfaces (not just localhost) so the dev server is
    // reachable from other devices on the LAN (e.g. a phone testing geolocation
    // / compass). CRA exposed the network by default; Vite does not.
    host: true,
    warmup: {
      // Pre-transform all page and appli components at startup so that
      // first navigation to a lazy route hits the cache instead of waiting
      // for on-demand transformation.
      clientFiles: [
        './src/pages/**/*.jsx',
        './src/components/appli/**/*.jsx'
      ]
    }
  },
  build: {
    outDir: 'dist'
  },
  optimizeDeps: {
    // CJS deps that need pre-bundling for ESM interop (notably leaflet-draw,
    // which has no default export but react-leaflet-draw imports one).
    include: [
      'swagger-ui-react',
      '@asymmetrik/leaflet-d3',
      'ramda',
      'react-leaflet-draw'
    ]
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.js',
    css: true
  }
});
