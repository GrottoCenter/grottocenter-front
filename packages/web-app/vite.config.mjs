import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import { compression } from 'vite-plugin-compression2';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    // SVG imported with `?react` becomes a React component; a bare `.svg`
    // import stays a URL (keeps src/assets/icons/index.js working untouched).
    svgr(),
    compression({ algorithm: 'gzip' }),
    compression({ algorithm: 'brotliCompress', deleteOriginalAssets: false }),
    visualizer({ filename: 'dist/stats.html', gzipSize: true, brotliSize: true })
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
