// Workbox serializes these callbacks with toString(): module bindings do not
// reach the generated service worker, so keep the SVG literal inside the callback.
export const osmTileCachePlugin = {
  cachedResponseWillBeUsed: async ({ request, cachedResponse }) => {
    // Leaflet's <img> requests cache opaque no-cors responses. PDF export
    // fetches the same URLs with CORS so it can read and draw the tile bytes.
    // Cache matching does not distinguish request modes. Treat an incompatible
    // entry as a miss so CacheFirst fetches and caches a readable replacement.
    if (cachedResponse?.type === 'opaque' && request.mode !== 'no-cors')
      return null;
    return cachedResponse;
  },
  handlerDidError: async ({ request }) => {
    // Exports must fail on missing tiles rather than receive a placeholder.
    // Returning null lets Workbox propagate the original download failure.
    if (request.mode !== 'no-cors') return null;

    // Offline over an area never visited online, CacheFirst rejects with
    // `no-response`, one uncaught promise per tile. Answering with an SVG (an
    // <img> loads it fine) silences that, so Leaflet's errorTileUrl never applies.
    // Keep Leaflet's offline placeholder byte-identical to ERROR_TILE_URL in
    // src/components/common/Maps/common/LayersControl.jsx.
    return new globalThis.Response(
      '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">' +
        '<rect width="256" height="256" fill="#f5f5f5"/>' +
        '<path d="M0 128h256M128 0v256" stroke="#e0e0e0" stroke-width="1" stroke-dasharray="4 6"/>' +
        '</svg>',
      { headers: { 'Content-Type': 'image/svg+xml' } }
    );
  }
};
