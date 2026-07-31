/**
 * Delete every runtime cache maintained by the service worker while keeping
 * the precache (app shell) intact — otherwise the app itself would stop
 * working offline. Precache entries live in caches whose name starts with
 * `workbox-precache`; everything else is a runtime cache defined by our
 * `runtimeCaching` rules (osm-tiles, api-get, blob-images, …). Enumerating
 * caches instead of hardcoding names means new runtime caches are covered
 * automatically as they're added to vite.config.mjs.
 */
export async function clearOfflineData() {
  if (typeof caches === 'undefined') return;
  const names = await caches.keys();
  await Promise.all(
    names
      .filter(name => !name.startsWith('workbox-precache'))
      .map(name => caches.delete(name))
  );
}

/**
 * Total bytes used by this origin across all storage backends (Cache Storage,
 * IndexedDB, localStorage, …). Dominated by our SW caches in practice, so it's
 * a good proxy for "how much does the offline copy take". Returns null when
 * the Storage API is unavailable (older browsers, some in-app WebViews).
 */
export async function getStorageUsage() {
  if (typeof navigator === 'undefined' || !navigator.storage?.estimate) {
    return null;
  }
  try {
    const { usage } = await navigator.storage.estimate();
    return typeof usage === 'number' ? usage : null;
  } catch {
    return null;
  }
}
