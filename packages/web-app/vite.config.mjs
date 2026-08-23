import { defineConfig, loadEnv } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import { compression } from 'vite-plugin-compression2';
import { visualizer } from 'rollup-plugin-visualizer';
import { VitePWA } from 'vite-plugin-pwa';
import pdfJsWasmAssets from './vite/pdfJsWasmAssets.mjs';

const escapeRegex = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export default defineConfig(({ mode }) => {
  // Pull VITE_API_URL out of the env file so the SW's runtimeCaching pattern
  // matches whichever backend this build targets (prod, staging, local).
  const env = loadEnv(mode, process.cwd(), '');
  const apiOrigin = env.VITE_API_URL ? new URL(env.VITE_API_URL).origin : null;
  // Build a RegExp for the runtimeCaching urlPattern. A closure over apiOrigin
  // would NOT work: vite-plugin-pwa serialises the function via .toString(),
  // so the free variable becomes `undefined` in the SW runtime and the rule
  // silently never matches. A RegExp serialises cleanly.
  //
  // Negative lookahead excludes map viewport queries (?sw_lat=…&ne_lat=…),
  // whose URLs are unique per pan/zoom position — caching them fills the LRU
  // in minutes with entries no one will ever revisit, evicting the actually
  // useful responses (/account, /notifications, /entrances/{id}, …). Skipping
  // them here means map endpoints just hit the network (no offline value lost:
  // the exact viewport is never reproduced offline anyway).
  const apiPattern = apiOrigin
    ? new RegExp(`^${escapeRegex(apiOrigin)}/api/(?!.*[?&]sw_lat=)`)
    : null;
  // A prod build without VITE_API_URL ships zero API caching. Surface it loudly
  // so a misconfigured pipeline doesn't quietly break offline support.
  if (!apiOrigin && mode !== 'development') {
    console.warn(
      '[vite-plugin-pwa] VITE_API_URL is not set — API runtime caching disabled.'
    );
  }
  // ⚠️ Every /geoloc rule below MUST include the API version segment: routes are
  // built as `${VITE_API_URL}/api/${apiVersion}/…` (see src/conf/apiRoutes.js),
  // so the real path is `/api/v1/geoloc/…`. A pattern written `/api/geoloc/…`
  // matches nothing — and fails silently, because the generic `api-get` rule
  // below cannot pick up the slack either (its `sw_lat` lookahead excludes
  // exactly these URLs). The result is a map with zero offline data. Matched as
  // `v\d+` rather than a literal `v1` so bumping apiVersion doesn't quietly
  // disable offline support again.
  const apiVersionedPrefix = apiOrigin
    ? `^${escapeRegex(apiOrigin)}/api/v\\d+`
    : null;
  // /geoloc/{entrances,networks,massifs}Coordinates — server recomputes these
  // in a daily batch job, so stale-while-revalidate is safe and dramatic: a
  // reload serves the ~MB-sized point payload from cache instantly, then
  // refreshes in the background. The dedicated `Coordinates` path suffix (vs
  // the viewport endpoints `/geoloc/entrances`, `/geoloc/networks`, …) is
  // what lets us match them narrowly.
  const bulkDailyCoordsPattern = apiVersionedPrefix
    ? new RegExp(
        `${apiVersionedPrefix}/geoloc/(entrances|networks|massifs)Coordinates(\\?|$)`
      )
    : null;
  // /geoloc/organizations with world-wide bounds (sw_lat=-90) — same URL as
  // the viewport endpoint, distinguished by the world-bounds param. Orgs can
  // be created/edited at any moment by any user, so NetworkFirst (fresh
  // online, cache fallback offline) with a short timeout to keep bad
  // connections snappy.
  const orgsBulkPattern = apiVersionedPrefix
    ? new RegExp(`${apiVersionedPrefix}/geoloc/organizations\\?sw_lat=-90&`)
    : null;
  // Map viewport data, requested on a FIXED slippy-tile grid (see
  // src/utils/mapTileCache.js): bounds are derived from {z,x,y} at CACHE_ZOOM,
  // so the same tile always produces the same URL. That is what makes these
  // cacheable at all — the general api-get rule still excludes free-form
  // `?sw_lat=` viewport queries, whose URLs are unique per pan/zoom.
  //
  // The `Coordinates` suffix of the bulk endpoints sits before the `?`, so
  // `/geoloc/entrancesCoordinates?…` never matches this pattern. The bulk
  // organizations fetch DOES share this URL shape, but its own rule is
  // registered earlier and Workbox routes to the first match — deliberately
  // no negative lookahead here: it would depend on the parameter order
  // produced by makeUrl (i.e. on the key order of MAX_BOUNDS in
  // actions/Map.js), an invisible coupling across files.
  const mapTilePattern = apiVersionedPrefix
    ? new RegExp(
        `${apiVersionedPrefix}/geoloc/(entrances|networks|organizations)\\?`
      )
    : null;

  return {
    plugins: [
      react(),
      // SVG imported with `?react` becomes a React component; a bare `.svg`
      // import stays a URL (keeps src/assets/icons/index.js working untouched).
      svgr(),
      pdfJsWasmAssets(),
      compression({ algorithm: 'gzip' }),
      compression({ algorithm: 'brotliCompress', deleteOriginalAssets: false }),
      visualizer({
        filename: 'dist/stats.html',
        gzipSize: true,
        brotliSize: true
      }),
      // PWA / Service Worker (Workbox under the hood). Required to package the
      // app as an Android TWA. The SW is registered by <UpdatePrompt>
      // (src/components/appli/UpdatePrompt.jsx), which also drives the update UI.
      VitePWA({
        // 'prompt': a new SW installs, then WAITS until the user accepts the
        // update. Deliberate choice, on two counts:
        //  - the running page keeps the precache its own hashed chunks live in,
        //    so lazy routes (App.jsx code-splitting) still resolve after a
        //    deploy. A SW claiming clients mid-session swaps in a precache the
        //    old chunk names are gone from → "Failed to fetch dynamically
        //    imported module" on the next navigation to a not-yet-loaded route.
        //  - the reload happens on a click, at a moment the user picked, instead
        //    of silently discarding whatever they were doing.
        // ⚠️ Do not switch back to 'autoUpdate' without also setting
        // `workbox.skipWaiting: true`: the plugin only forces it when
        // injectRegister is 'auto', so with `injectRegister: false` that combo
        // builds a SW that never activates while a tab is open — the update
        // silently never lands.
        registerType: 'prompt',
        injectRegister: false,
        // Keep the historical manifest filename so the existing twa-manifest.json
        // (webManifestUrl: .../manifest.json) stays valid. (Service worker stays
        // the default sw.js.)
        manifestFilename: 'manifest.json',
        includeAssets: [
          'favicon.ico',
          'logo.svg',
          'apple-touch-icon.png',
          'shortcut-map.png',
          'shortcut-entrances.png'
        ],
        manifest: {
          id: '/',
          short_name: 'Grottocenter',
          name: 'Grottocenter',
          description: 'The Wiki database made by cavers for cavers.',
          lang: 'en',
          dir: 'ltr',
          categories: ['education', 'navigation', 'travel'],
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
          ],
          // Long-press shortcuts on the installed app icon (Android). URLs must
          // stay within `scope`.
          shortcuts: [
            {
              name: 'Map',
              short_name: 'Map',
              description: 'Explore caves and entrances on the map',
              url: '/ui/map',
              icons: [
                { src: 'shortcut-map.png', type: 'image/png', sizes: '96x96' }
              ]
            },
            {
              name: 'Search entrances',
              short_name: 'Entrances',
              description: 'Search cave entrances',
              url: '/ui/entrances',
              icons: [
                {
                  src: 'shortcut-entrances.png',
                  type: 'image/png',
                  sizes: '96x96'
                }
              ]
            }
          ],
          // Shown in the browser/OS "richer install" UI (Chrome install dialog,
          // Play Store TWA listing). Not service-worker-precached — fetched
          // on-demand only when that UI is shown. All narrow (phone) shots share
          // the same capture size.
          screenshots: [
            {
              src: 'screenshots/home-mobile.jpg',
              type: 'image/jpeg',
              sizes: '1080x2340',
              form_factor: 'narrow',
              label: 'Home page'
            },
            {
              src: 'screenshots/map-mobile.jpg',
              type: 'image/jpeg',
              sizes: '1080x2340',
              form_factor: 'narrow',
              label: 'Interactive map of caves and entrances'
            },
            {
              src: 'screenshots/map-detail-mobile.jpg',
              type: 'image/jpeg',
              sizes: '1080x2340',
              form_factor: 'narrow',
              label: 'Map entry detail'
            },
            {
              src: 'screenshots/entrances-list-mobile.jpg',
              type: 'image/jpeg',
              sizes: '1080x2340',
              form_factor: 'narrow',
              label: 'Search cave entrances'
            },
            {
              src: 'screenshots/network-mobile.jpg',
              type: 'image/jpeg',
              sizes: '1080x2340',
              form_factor: 'narrow',
              label: 'Cave network view'
            },
            {
              src: 'screenshots/massifs-mobile.jpg',
              type: 'image/jpeg',
              sizes: '1080x2340',
              form_factor: 'narrow',
              label: 'Massifs browser'
            },
            {
              src: 'screenshots/topo-mobile.jpg',
              type: 'image/jpeg',
              sizes: '1080x2340',
              form_factor: 'narrow',
              label: 'Topographic survey viewer'
            },
            {
              src: 'screenshots/riggings-mobile.jpg',
              type: 'image/jpeg',
              sizes: '1080x2340',
              form_factor: 'narrow',
              label: 'Rigging details'
            },
            {
              src: 'screenshots/add-mobile.jpg',
              type: 'image/jpeg',
              sizes: '1080x2340',
              form_factor: 'narrow',
              label: 'Add a new entrance, document, massif or organization'
            },
            {
              src: 'screenshots/activities-mobile.jpg',
              type: 'image/jpeg',
              sizes: '1080x2340',
              form_factor: 'narrow',
              label: 'Recent activity feed'
            },
            {
              src: 'screenshots/messages-mobile.jpg',
              type: 'image/jpeg',
              sizes: '1080x2340',
              form_factor: 'narrow',
              label: 'Messages'
            },
            {
              src: 'screenshots/menu-mobile.jpg',
              type: 'image/jpeg',
              sizes: '1080x2340',
              form_factor: 'narrow',
              label: 'Navigation menu'
            },
            // Tablet (wide) shots — used by the Play Store tablet listing and by
            // Chrome's install dialog on large screens.
            {
              src: 'screenshots/home-tablet10.png',
              type: 'image/png',
              sizes: '2732x2048',
              form_factor: 'wide',
              label: 'Home page (10" tablet)'
            },
            {
              src: 'screenshots/home-tablet7.png',
              type: 'image/png',
              sizes: '2736x1824',
              form_factor: 'wide',
              label: 'Home page (7" tablet)'
            },
            {
              src: 'screenshots/map-tablet10.png',
              type: 'image/png',
              sizes: '2732x2048',
              form_factor: 'wide',
              label: 'Interactive map (10" tablet)'
            },
            {
              src: 'screenshots/map-tablet7.png',
              type: 'image/png',
              sizes: '2736x1824',
              form_factor: 'wide',
              label: 'Interactive map (7" tablet)'
            }
          ]
        },
        workbox: {
          // Precache lang/*.json too — otherwise the initial locale fetch in
          // index.html fails offline and blocks the loader from clearing.
          globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2,json}'],
          // stats.html is the bundle-analysis report (visualizer), ~8 MB — never
          // precache it. Also keep the gzip/brotli copies out of the precache.
          // /.well-known/assetlinks.json is a no-cache file by design (see
          // staticwebapp.config.json): precaching it would serve a stale copy
          // offline and silently break Digital Asset Links after a cert rotation.
          // /screenshots/** are install-UI assets (Chrome install dialog / Play
          // Store listing): fetched on-demand only when that UI is shown, so
          // precaching would waste ~10 MB on every user (esp. the tablet PNGs)
          // for content most will never see. Mobile JPGs are already outside
          // the precache glob and excluded from the runtime image cache — this
          // extends the same intent to the tablet PNGs.
          globIgnores: [
            '**/stats.html',
            '**/*.{gz,br}',
            '**/.well-known/**',
            '**/screenshots/**'
          ],
          // Take control of the page on the very first load so offline works
          // from the first visit (matches the previous CRA SW's clientsClaim()).
          clientsClaim: true,
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api/, /^\/\.well-known/],
          cleanupOutdatedCaches: true,
          runtimeCaching: [
            {
              // OpenStreetMap basemap tiles (default Leaflet layer).
              // Leaflet rotates between a/b/c.tile.openstreetmap.org for parallel
              // downloads → without normalization, the same (z,x,y) tile ends up
              // cached up to 3 times under 3 different hostnames. The
              // cacheKeyWillBeUsed hook strips the subdomain so all three hit
              // the same cache entry.
              urlPattern: ({ url }) =>
                /tile\.openstreetmap\.org/.test(url.href),
              handler: 'CacheFirst',
              options: {
                cacheName: 'osm-tiles',
                expiration: {
                  maxEntries: 500,
                  maxAgeSeconds: 60 * 60 * 24 * 30
                },
                cacheableResponse: { statuses: [0, 200] },
                plugins: [
                  {
                    cacheKeyWillBeUsed: async ({ request }) => {
                      const url = new URL(request.url);
                      url.hostname = url.hostname.replace(
                        /^[a-z]\.tile\.openstreetmap\.org$/,
                        'tile.openstreetmap.org'
                      );
                      return url.toString();
                    },
                    // Offline over an area never visited online: nothing cached,
                    // nothing reachable. CacheFirst then rejects with
                    // `no-response`, which surfaces as an uncaught promise per
                    // tile — dozens per pan, drowning the console. Resolving
                    // with an SVG (an <img> loads it fine) silences that.
                    //
                    // Byte-identical to ERROR_TILE_URL in
                    // src/components/common/Maps/common/LayersControl.jsx — a
                    // missing tile must look the same whichever layer it came
                    // from, and answering here means Leaflet never sees an
                    // error, so `errorTileUrl` can't cover these two hosts.
                    // Kept literal on purpose: workbox-build serializes this
                    // function with toString(), so a closure variable would not
                    // survive into the generated service worker.
                    handlerDidError: async () =>
                      new Response(
                        '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">' +
                          '<rect width="256" height="256" fill="#f5f5f5"/>' +
                          '<path d="M0 128h256M128 0v256" stroke="#e0e0e0" stroke-width="1" stroke-dasharray="4 6"/>' +
                          '</svg>',
                        { headers: { 'Content-Type': 'image/svg+xml' } }
                      )
                  }
                ]
              }
            },
            {
              // OpenTopoMap basemap tiles — separate cache so switching basemaps
              // doesn't evict the other's offline area, and to allow a longer TTL
              // (OpenTopoMap updates less often / stricter usage policy). Same
              // subdomain normalization as OSM.
              urlPattern: ({ url }) => /tile\.opentopomap\.org/.test(url.href),
              handler: 'CacheFirst',
              options: {
                cacheName: 'opentopomap-tiles',
                expiration: {
                  maxEntries: 500,
                  maxAgeSeconds: 60 * 60 * 24 * 90
                },
                cacheableResponse: { statuses: [0, 200] },
                plugins: [
                  {
                    cacheKeyWillBeUsed: async ({ request }) => {
                      const url = new URL(request.url);
                      url.hostname = url.hostname.replace(
                        /^[a-z]\.tile\.opentopomap\.org$/,
                        'tile.opentopomap.org'
                      );
                      return url.toString();
                    },
                    // Same as the OSM rule: swallow the `no-response` rejection
                    // for tiles missing offline, with the same placeholder
                    // (see comment above).
                    handlerDidError: async () =>
                      new Response(
                        '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">' +
                          '<rect width="256" height="256" fill="#f5f5f5"/>' +
                          '<path d="M0 128h256M128 0v256" stroke="#e0e0e0" stroke-width="1" stroke-dasharray="4 6"/>' +
                          '</svg>',
                        { headers: { 'Content-Type': 'image/svg+xml' } }
                      )
                  }
                ]
              }
            },
            {
              // Country flags (components/appli/Country/CountryList.jsx pulls
              // them from flagcdn.com, both 1x and 2x). Tiny, immutable per ISO
              // code, and a country list riddled with broken-image icons is one
              // of the most visible offline regressions — so CacheFirst with a
              // long TTL. 500 entries covers every country at both densities.
              //
              // `statuses: [0, ...]` matters here: this is a cross-origin
              // request with no CORS headers, so the response is opaque and
              // reports status 0. Without it Workbox would refuse to store it
              // and the flags would never be cached at all.
              urlPattern: ({ url }) => url.hostname === 'flagcdn.com',
              handler: 'CacheFirst',
              options: {
                cacheName: 'country-flags',
                expiration: {
                  maxEntries: 500,
                  maxAgeSeconds: 60 * 60 * 24 * 180,
                  purgeOnQuotaError: true
                },
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
            },
            // Daily-recomputed bulk coordinates (entrances / networks / massifs).
            // StaleWhileRevalidate: serve cached payload immediately (huge win
            // for the ~MB entrance dataset on reload), refresh in the background.
            // 2-day maxAge is a 2× safety net over the server's daily batch.
            // Placed BEFORE the api-get rule so the sw_lat lookahead in api-get
            // (which excludes viewport queries and would sweep these in too)
            // is shadowed for these specific paths.
            //
            // maxEntries is NOT just "3 global datasets": the massif page fetches
            // entrancesCoordinates with a per-massif bbox (see MapMassif.jsx), so
            // every visited massif adds an entry to this same LRU. At 5, browsing
            // a couple of massifs evicted the world-wide entrance dataset
            // (~700 KB gzipped) and emptied the global map's clusters offline.
            ...(bulkDailyCoordsPattern
              ? [
                  {
                    urlPattern: bulkDailyCoordsPattern,
                    handler: 'StaleWhileRevalidate',
                    options: {
                      cacheName: 'api-map-coords-daily',
                      expiration: {
                        maxEntries: 40,
                        maxAgeSeconds: 60 * 60 * 24 * 2,
                        purgeOnQuotaError: true
                      },
                      cacheableResponse: { statuses: [0, 200] },
                      matchOptions: { ignoreVary: true }
                    }
                  }
                ]
              : []),
            // Organizations world-bounds bulk fetch. NetworkFirst because any
            // user can create/edit an org at any time — we want fresh data
            // online. 3s timeout falls back to cache on bad networks / offline.
            ...(orgsBulkPattern
              ? [
                  {
                    urlPattern: orgsBulkPattern,
                    handler: 'NetworkFirst',
                    options: {
                      cacheName: 'api-map-orgs-bulk',
                      networkTimeoutSeconds: 3,
                      expiration: {
                        maxEntries: 2,
                        maxAgeSeconds: 60 * 60 * 24 * 7
                      },
                      cacheableResponse: { statuses: [0, 200] },
                      matchOptions: { ignoreVary: true }
                    }
                  }
                ]
              : []),
            // Map viewport tiles. MUST stay after the two bulk rules above (they
            // win by registration order) and before api-get (whose sw_lat
            // lookahead would otherwise never let these through).
            //
            // StaleWhileRevalidate: paint instantly from cache, refresh in the
            // background. NetworkFirst would add latency to every pan while
            // online; CacheFirst would never refresh a changed tile.
            //
            // Without this rule the tile cache lives only in memory
            // (src/utils/mapTileCache.js), so relaunching the PWA offline showed
            // an empty map above the clustering threshold — precisely the field
            // use case. maxEntries is a starting point: Workbox can only bound a
            // number of entries, never a byte budget, so recalibrate against the
            // real payload size of a dense karst tile.
            ...(mapTilePattern
              ? [
                  {
                    urlPattern: mapTilePattern,
                    handler: 'StaleWhileRevalidate',
                    options: {
                      cacheName: 'api-map-tiles',
                      expiration: {
                        maxEntries: 300,
                        maxAgeSeconds: 60 * 60 * 24 * 7,
                        purgeOnQuotaError: true
                      },
                      cacheableResponse: { statuses: [0, 200] },
                      matchOptions: { ignoreVary: true },
                      plugins: [
                        {
                          // `zoom` is sent by mapTileCache but read by no
                          // /geoloc controller (they only use sw_lat/sw_lng/
                          // ne_lat/ne_lng + massifId). Dropping it from the CACHE
                          // KEY — rather than from the request — keeps one entry
                          // per tile instead of one per tile×zoom pair, without
                          // touching the map code. Same idiom as the OSM
                          // subdomain normalization above.
                          //
                          // The coupling with mapTileCache is one-directional:
                          // should it stop sending `zoom`, the delete() finds
                          // nothing and the key is already the canonical one —
                          // the hook degrades to a no-op instead of breaking.
                          cacheKeyWillBeUsed: async ({ request }) => {
                            const url = new URL(request.url);
                            url.searchParams.delete('zoom');
                            return url.toString();
                          }
                        }
                      ]
                    }
                  }
                ]
              : []),
            // Backend API (GET only — workbox defaults runtimeCaching to GET).
            // NetworkFirst so users see fresh data when online but still get the
            // last-known response offline. networkTimeoutSeconds keeps a bad
            // connection from stalling the UI — after 5s we fall back to cache.
            // Skipped entirely if VITE_API_URL isn't set at build time.
            ...(apiPattern
              ? [
                  {
                    urlPattern: apiPattern,
                    handler: 'NetworkFirst',
                    options: {
                      cacheName: 'api-get',
                      networkTimeoutSeconds: 5,
                      expiration: {
                        maxEntries: 200,
                        maxAgeSeconds: 60 * 60 * 24 * 7
                      },
                      // Ignore Vary headers (API sends Vary: Accept-Encoding).
                      // Prevents a rare cache-miss when the browser negotiates a
                      // different encoding offline vs online.
                      matchOptions: { ignoreVary: true },
                      // Paginated endpoints answer 206 + Content-Range (documents,
                      // notifications, messages/conversations…), and the Cache API
                      // refuses cache.put() on a 206 outright — "Partial response
                      // is unsupported" is the spec, not a Workbox rule. Left
                      // alone, every list in the app is a blank page offline no
                      // matter how often it was opened online.
                      //
                      // So rebuild the 206 as a 200 before storing it.
                      // Content-Range is copied over: actions/utils.js
                      // getTotalCount() reads it back on a cache hit to keep
                      // pagination correct, and the API exposes it through CORS
                      // (access-control-expose-headers).
                      //
                      // The status/200 + Content-Range combo is non-standard
                      // (Content-Range is defined for 206/416), but deliberate:
                      // it is the shape the Cache API will actually store, and
                      // callers only ever read the header value, not the code.
                      //
                      // Status filtering lives in this same hook rather than in
                      // the `cacheableResponse` option: that option IS itself a
                      // cacheWillUpdate plugin, and whichever runs first wins —
                      // it would reject the 206 before this ever sees it.
                      //
                      // ⚠️ No free variables: vite-plugin-pwa serialises this
                      // with .toString() (see the apiPattern note at the top of
                      // this file), so a closure would land as `undefined` in the
                      // service worker and fail silently.
                      plugins: [
                        {
                          cacheWillUpdate: async ({ response }) => {
                            if (
                              response.status === 0 ||
                              response.status === 200
                            )
                              return response;
                            if (response.status !== 206) return null;
                            return new Response(await response.clone().blob(), {
                              status: 200,
                              statusText: 'OK',
                              headers: response.headers
                            });
                          }
                        }
                      ]
                    }
                  }
                ]
              : []),
            {
              // Country flags from flagcdn.com — immutable per URL (ISO codes
              // don't change), small PNGs, bounded set (~200 countries × 2
              // sizes). CacheFirst with no TTL, just LRU-cap.
              urlPattern: ({ url }) => url.hostname === 'flagcdn.com',
              handler: 'CacheFirst',
              options: {
                cacheName: 'country-flags',
                expiration: { maxEntries: 500, purgeOnQuotaError: true },
                cacheableResponse: { statuses: [0, 200] }
              }
            },
            {
              // Thumbnails on Azure Blob Storage — small (10-50 KB each), served
              // in every list/card, so we keep a lot of them. URL shape is
              // `/thumbnails/{small|medium|large}/...` (see grottocenter-api
              // ThumbnailService.getThumbnailPath).
              urlPattern: ({ url, request }) =>
                request.destination === 'image' &&
                /\.blob\.core\.windows\.net$/.test(url.hostname) &&
                url.pathname.includes('/thumbnails/'),
              handler: 'CacheFirst',
              options: {
                cacheName: 'blob-thumbnails',
                expiration: {
                  maxEntries: 400,
                  purgeOnQuotaError: true
                },
                cacheableResponse: { statuses: [0, 200] }
              }
            },
            {
              // Full-resolution photos on Azure Blob Storage — can weigh several
              // MB each, so cap tight (50 × ~3 MB ≈ 150 MB max). URLs are
              // content-addressed via a random prefix (see FileService
              // .generateName), safe for CacheFirst without TTL.
              urlPattern: ({ url, request }) =>
                request.destination === 'image' &&
                /\.blob\.core\.windows\.net$/.test(url.hostname),
              handler: 'CacheFirst',
              options: {
                cacheName: 'blob-images-full',
                expiration: {
                  maxEntries: 50,
                  purgeOnQuotaError: true
                },
                cacheableResponse: { statuses: [0, 200] }
              }
            },
            {
              // Same-origin raster images NOT covered by the precache glob
              // (jpg/jpeg/gif/webp/avif — the glob only precaches png/svg/ico).
              // Homepage backgrounds (images/caves/*.jpg), partner logos, the
              // news image, etc. Matched by extension rather than
              // request.destination: some of these are CSS `background-image`
              // URLs (e.g. images/caves/topo.jpg) whose request destination is
              // unreliable across browsers, but the pathname extension is not.
              // CacheFirst: cached lazily on first fetch, then served offline.
              // Excludes /screenshots/ (PWA install-UI assets, larger and rarely
              // re-shown — kept out of this LRU by design, as they are the
              // precache too). Document images live on Azure Blob (cross-origin)
              // and are handled by the blob-* rules above, so they never match
              // here.
              urlPattern: ({ url, sameOrigin }) =>
                sameOrigin &&
                !url.pathname.startsWith('/screenshots/') &&
                /\.(?:jpe?g|gif|webp|avif)$/i.test(url.pathname),
              handler: 'CacheFirst',
              options: {
                cacheName: 'static-images',
                expiration: {
                  maxEntries: 60,
                  maxAgeSeconds: 60 * 60 * 24 * 30,
                  purgeOnQuotaError: true
                },
                cacheableResponse: { statuses: [0, 200] }
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
        {
          find: '@',
          replacement: fileURLToPath(new URL('./src', import.meta.url))
        },
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
        clientFiles: ['./src/pages/**/*.jsx', './src/components/appli/**/*.jsx']
      }
    },
    build: {
      outDir: 'dist'
    },
    optimizeDeps: {
      // CJS deps that need pre-bundling for ESM interop (notably leaflet-draw,
      // which has no default export but react-leaflet-draw imports one).
      include: ['swagger-ui-react', 'ramda', 'react-leaflet-draw']
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './src/setupTests.js',
      css: true
    }
  };
});
