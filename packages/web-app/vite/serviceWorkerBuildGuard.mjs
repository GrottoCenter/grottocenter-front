import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// Workbox serialises runtime-caching callbacks with Function#toString. When
// Vite bundles its config, a platform global captured by one of those callbacks
// can be renamed (for example URL -> URL$1). The renamed binding belongs to the
// Node config bundle and is absent from the generated service worker, so every
// matching request fails only at runtime.
const RENAMED_PLATFORM_GLOBAL =
  /\b(?:Blob|FormData|Headers|Request|Response|URL)\$\d+\b/g;

const serviceWorkerBuildGuard = () => {
  let serviceWorkerPath;

  return {
    name: 'service-worker-build-guard',
    apply: 'build',
    configResolved: config => {
      serviceWorkerPath = resolve(config.root, config.build.outDir, 'sw.js');
    },
    closeBundle: {
      order: 'post',
      sequential: true,
      handler: async () => {
        const source = await readFile(serviceWorkerPath, 'utf8');
        const renamedGlobals = [
          ...new Set(source.match(RENAMED_PLATFORM_GLOBAL))
        ];

        if (renamedGlobals.length > 0) {
          throw new Error(
            `Generated service worker contains out-of-scope platform globals: ${renamedGlobals.join(', ')}`
          );
        }
      }
    }
  };
};

export default serviceWorkerBuildGuard;
