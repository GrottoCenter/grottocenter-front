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

// ─── Offline-only usage ──────────────────────────────────────────────────────
//
// `getStorageUsage` measures the whole origin, but `clearOfflineData` only
// removes the runtime caches — the precache (the app itself, ~9 MB of JS and
// lang files) plus IndexedDB and localStorage are a floor the button can never
// free. Reporting the raw total both overstates the offline copy and makes a
// successful clear look like a rounding error.
//
// Rather than sum the deletable caches on every read (which means pulling every
// cached response body through — seconds on mobile), remember that floor once:
// a clear is exactly the moment it can be observed for free.
const BASELINE_KEY = 'offlineStorageBaseline';

const readBaseline = () => {
  try {
    const stored = Number(localStorage.getItem(BASELINE_KEY));
    return Number.isFinite(stored) && stored >= 0 ? stored : null;
  } catch {
    return null; // storage blocked (private mode) — just report the raw total
  }
};

const writeBaseline = bytes => {
  try {
    localStorage.setItem(BASELINE_KEY, String(bytes));
  } catch {
    // The baseline only refines a displayed number; losing it is not an error.
  }
};

const sleep = ms =>
  new Promise(resolve => {
    setTimeout(resolve, ms);
  });

/**
 * Remember what the origin weighs once the runtime caches are gone — the floor
 * `getOfflineDataUsage` subtracts. Call right after `clearOfflineData()`, and
 * let it run in the background: nothing on screen waits for it.
 *
 * It samples instead of reading once because `caches.delete()` resolves when
 * the cache is unlinked, not when its bytes are reclaimed — the browser purges
 * in the background and its quota figure only catches up over the next second
 * or two. Keeping the lowest sample lands on the floor without having to know
 * how long that takes, and without a "did it drop yet?" heuristic that a clear
 * freeing nothing would defeat anyway.
 *
 * The whole body is wrapped: at 8 × 300 ms this outlives a navigation, and an
 * unhandled rejection from a context whose storage has gone away would surface
 * in the console for a value nothing on screen is waiting for. Losing the
 * sampling run just means the next clear establishes the floor instead.
 */
export async function rememberOfflineBaseline(
  samples = 8,
  intervalMs = 300,
  lowest = Infinity
) {
  try {
    const usage = await getStorageUsage();
    if (usage == null) return;
    const best = Math.min(lowest, usage);
    if (samples > 1) {
      await sleep(intervalMs);
      await rememberOfflineBaseline(samples - 1, intervalMs, best);
      return;
    }
    writeBaseline(best);
  } catch {
    // Fire-and-forget: there is no caller to report to and nothing to retry.
  }
}

/**
 * Bytes attributable to the offline copy: total origin usage minus the
 * remembered floor. Never negative — a total below the floor means the floor
 * is stale (a lighter deploy, a browser eviction), so it is lowered to the new
 * reading instead of producing a negative size.
 *
 * Returns null when the Storage API is unavailable, and the raw total until a
 * first clear has established the floor.
 */
export async function getOfflineDataUsage() {
  const total = await getStorageUsage();
  if (total == null) return null;
  const baseline = readBaseline();
  if (baseline == null) return total;
  if (total <= baseline) {
    writeBaseline(total);
    return 0;
  }
  return total - baseline;
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
