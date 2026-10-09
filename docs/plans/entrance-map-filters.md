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

## Simplification follow-up

Baseline implementation committed as `62fcd512` before this follow-up.

- [x] Centralize preferences, normalization, toggles and reset in
  `useEntranceFilters`, preserving all existing storage keys.
- [x] Pass one filter object to the control; import fixed choices directly and
  provide a single disabled-reason key.
- [x] Validate coordinate criteria once per dataset in the Worker and report
  compatibility to the UI. Comment the legacy-cache fallback and bypasses.
- [x] Derive marker/polygon visibility from one zoom state and selected layers.
  Keep actual Leaflet zoom checks when requesting viewport data.
- [x] Shorten the offline-cache hint in all 15 languages.
- [x] Verify preferences, compatibility metadata, zoom/layer transitions,
  translations, modified-file lint and production bundling.

Follow-up validation: 83 unit tests across ten files passed using
`--pool=forks --maxWorkers=1 --testTimeout=15000`. Seven headless Electron
scenarios passed, covering combined filters/reset, a small viewport with
cluster/marker transitions and popup opening, saved interest, legacy data at
both zoom modes, layer toggles and the massif polygon threshold. In the small
viewport, popup closing uses a targeted DOM click while it pans the map;
bubble, marker and zoom-control interactions use pointer clicks.
Modified-file ESLint, translation checks and the production build passed.
The bundled Worker is included in the service worker precache.

## CI browser follow-up

The CI production build exposed service-worker cache interference between
mocked scenarios, stale MUI rating hover during simulated clicks, and rapid
checkbox clicks being interpreted as Leaflet touch double taps. Reuse one
service-worker isolation command for map and document-moderation scenarios.
Select preferences with native keyboard activation and assert their state;
keep pointer clicks for cluster activation, popup opening and zoom controls.

Validation against the downloaded CI production artifact: all seven map
scenarios passed in headless Chrome and Firefox; all 17 document-moderation
scenarios passed in Chrome. Modified-file ESLint and `git diff --check` passed.
