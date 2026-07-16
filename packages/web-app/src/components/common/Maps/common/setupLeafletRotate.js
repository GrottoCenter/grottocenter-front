// leaflet-rotate patches a *global* `L` at import time (its `src` entry
// references `L` without importing it). Leaflet's UMD build already exposes
// `window.L`, but stricter bundlers (e.g. Vite/Rollup, used on the migration
// branch) may not guarantee it — so we set it explicitly BEFORE importing the
// plugin. This module must be imported before `leaflet-rotate`.
import * as L from 'leaflet';

if (typeof window !== 'undefined' && !window.L) {
  window.L = L;
}
