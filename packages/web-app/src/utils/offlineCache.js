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

/**
 * Whether this origin's storage is exempt from automatic eviction. Returns
 * null when the Storage API is unavailable.
 */
export async function isStoragePersisted() {
  if (typeof navigator === 'undefined' || !navigator.storage?.persisted) {
    return null;
  }
  try {
    return await navigator.storage.persisted();
  } catch {
    return null;
  }
}

/**
 * Ask the browser not to evict our caches under storage pressure. Without it,
 * everything the user saved for a trip can vanish silently when the device
 * runs low on space.
 *
 * Deliberately NOT exposed as a user setting: the answer isn't the user's to
 * give. Chrome never prompts and decides from its own engagement heuristics,
 * Firefox prompts for a concept nobody can act on, and Safari applies its own
 * policy regardless — a "protect my data" button would therefore be an
 * unactionable control that fails without explanation. Callers should invoke
 * this on a strong intent signal instead (see src/index.jsx: installed app).
 *
 * Returns true/false once settled, or null when the API is unavailable.
 */
export async function ensurePersistentStorage() {
  const already = await isStoragePersisted();
  if (already !== false) return already; // true, or null when unsupported
  try {
    return await navigator.storage.persist();
  } catch {
    return null;
  }
}
