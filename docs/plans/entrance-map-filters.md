# Entrance filters at every zoom

Backend contract: GrottoCenter/grottocenter-api#1872 and #1863. Worldwide
entrances carry `[longitude, latitude, size, dataQuality, aestheticism]`.
Massif requests and other entity layers keep their existing behavior.

- [x] Share size, quality and displayed-interest filtering between markers
  and coordinate tuples; preserve stored preferences and missing-value rules.
- [x] Keep one entrance Worker per mounted map. Send coordinates only when
  they change, coalesce filter changes, and keep one current Supercluster
  index with maxZoom 12. Query clusters and expansion zoom asynchronously.
- [x] Discard obsolete filter/viewport responses and renew Leaflet bubbles
  when their index changes. Keep existing synchronous clustering elsewhere.
- [x] Enable filters at every zoom. Version the worldwide entrance request;
  preserve legacy offline coordinates without pretending they are filterable.
- [x] Distinguish filter-empty results from unavailable offline marker data.
- [x] Verify shared predicates, worker lifecycle/coalescing, cluster counts,
  positions/clicks, zoom transitions, legacy data and saved preferences with
  focused unit/browser tests. Check production bundling and modified-file lint.

Performance: reconstruction runs outside the UI thread. No index cache per
filter combination, no rebuild on pan/zoom, and no new filter API requests.
Real-device profiling remains necessary to quantify mobile latency and memory.

Validation completed:

- 79 focused unit tests across nine files passed. On this Windows machine,
  Vitest used `--pool=forks --maxWorkers=1 --testTimeout=15000`.
- Four Cypress scenarios passed with headless Electron: combined filters and
  reset, mobile cluster/marker transitions and popup clicks, saved interest,
  and legacy coordinate pairs.
- Modified-file ESLint, translation synchronization/sorting, and production
  build passed. The entrance Worker is bundled separately and precached by
  the service worker for offline use.
