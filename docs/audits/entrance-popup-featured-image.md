# Entrance popup featured-image reads

Implements [frontend #1619](https://github.com/GrottoCenter/grottocenter-front/issues/1619),
assuming the contract in [API #1995](https://github.com/GrottoCenter/grottocenter-api/pull/1995)
is deployed.

## Cache behavior

- An uncached, active popup reads `/entrances/:id/featured-image` using the shared
  API client and the five-minute `STALE.STANDARD` tier.
- The lightweight key extends `entranceKeys.detail(id)`, so existing entrance
  invalidation and permanent deletion also cover popup metadata. A partial
  response never fills the full detail key. Deletion/restoration prefix writes
  update only fields already present in each response, preserving partial shapes.
- Fresh full detail is borrowed without copying it into the lightweight cache or
  renewing its age. Changes to that detail cache are observed so invalidation
  immediately enables a lightweight read, even while a popup is already open.
  Aging alone emits no cache event, so borrowed data can remain visible past the
  freshness window until the next render.
- Saving a featured file invalidates the lightweight cache while retaining a full
  PUT response as fresh detail. Document edits, unlinking, moderation, deletion
  and restoration invalidate both kinds of entrance reads.
- Opening the entrance page after a lightweight read still requests full detail.
  The map's delayed URL update cannot undo navigation to that page while its lazy
  module loads.

## Validation

Targeted Vitest coverage includes separate caches, normalized ids, freshness,
borrowing full detail, invalidation while open, document eligibility changes,
complete page reads, thumbnail fallback, missing images and late responses.

43 unique targeted Vitest tests passed across the query, popup, entrance form,
document form, association and moderation checks. The final query and popup
checks used one worker and a 15-second test timeout on the loaded Windows machine:

```powershell
yarn.cmd test src/hooks/queries/useEntranceFeaturedImage.test.jsx --maxWorkers=1 --testTimeout=15000
yarn.cmd test src/components/common/Maps/common/EntrancePopupImages.test.jsx --maxWorkers=1 --testTimeout=15000
```

All 39 scenarios in `entrance-featured-image.cy.js` were validated across the
initial run and focused reruns. Initial request waits allow 20 seconds for lazy
application loading. The complete spec can be rerun with:

```powershell
yarn.cmd e2e:run --spec cypress/e2e/entrance-featured-image.cy.js --browser electron
```

If the shell inherited `ELECTRON_RUN_AS_NODE=1`, remove that environment variable
for the Cypress process. All modified lintable files pass ESLint.

### Review regression checks

The deletion/restoration tests verify that full mutation responses update cached
popup metadata without adding documents or descriptions, while still updating
the full detail cache. Fake-timer tests exercise the real map page's delayed URL
update: it runs on map routes, skips navigation after leaving the map even while
the component remains mounted, and is canceled on unmount. The route declaration,
matcher and generated URL share `MAP_ROUTE`.

29 unique Vitest tests passed across the initial run and the map rerun after
correcting the test's expected URL to match React Router's comma encoding:

```powershell
yarn.cmd test --run src/utils/entityDeletionCache.test.js src/pages/Map.test.jsx src/hooks/queries/useEntranceFeaturedImage.test.jsx --maxWorkers=2
yarn.cmd test --run src/pages/Map.test.jsx --maxWorkers=2
```

### Deployed API smoke check (2026-11-09)

Anonymous requests to `https://api.grottocenter.org/api/v1/entrances/1/featured-image`
and `/api/v1/entrances/120177/featured-image` returned HTTP 200. Both responses
contained exactly `id`, `name`, `isDeleted`, `redirectTo`, and `featuredFile`;
their ids, names and featured files matched the full detail responses. Both had
`featuredFile: null`. A request with the production frontend Origin header
returned `Access-Control-Allow-Origin: *`. Unknown entrance `2147483647` returned
HTTP 404.

This verifies that the deployed route is available. A live browser popup with a
selected photo remains unchecked; these samples had no featured file. The
existing Cypress scenarios cover image rendering using fixtures.

## Local performance comparison

Measured on 2026-11-09 against `develop` at `6de98bfd9` and this implementation,
using Electron 146, Vite development servers and a 1280 × 900 viewport. Each
version opens five popups with fresh application/query state. Both use the
entrance and image fixtures from `entrance-featured-image.cy.js`; only the
metadata response changes from the complete entrance to the compact contract.
Service workers are disabled and API/image responses are intercepted locally.

Raw sizes count UTF-8 bytes of `JSON.stringify(response)`. Browser Resource Timing
records the metadata and thumbnail request starts; a capture listener records the
marker click. Resource timings are cleared just before clicking so Vite's module
requests cannot exhaust the timing buffer.

| Metric | Full detail | Lightweight |
| --- | ---: | ---: |
| Successful samples | 5 | 5 |
| Raw metadata JSON | 1,062 bytes | 279 bytes |
| Median click → thumbnail request | 300.8 ms | 244.3 ms |
| Click → thumbnail request range | 201.5–347.0 ms | 228.3–289.0 ms |
| Median metadata request → thumbnail request | 224.2 ms | 174.6 ms |

The fixture metadata shrinks by **73.7%**. The timing ranges overlap, and five
mocked samples are insufficient to attribute the observed difference to this
change or claim a production speedup.

These measurements isolate frontend behavior with mocked responses. They do not
measure real API/database latency, compression, mobile networks or production
performance. The API PR contains separate fixture measurements of SQL work and
compressed response sizes. The request count on a cache miss and the downloaded
image are unchanged.

### Popup opening review (2026-11-11)

Popup preparation is opt-in per Leaflet map. `EntrancePopupImages` registers its
map while mounted; the shared popup factory receives that map explicitly and
leaves other maps alone. The raw entrance-form map therefore keeps its nearby
entrance and search popups visible and text-only, without image requests. No
private Leaflet map reference is needed.

The two-second deadline makes the text available without abandoning a slow
photo. Metadata and the eager image can finish afterward. The image stays hidden
and outside the popup's photo layout until decoding completes, then upgrades the
text presentation once. That upgrade may require one additional pan. If a pan is
already running, Leaflet measures the new content immediately and postpones only
the next pan until `moveend`. Closing a popup still discards late callbacks.

Regression scenarios include metadata delayed by 900 ms followed by a thumbnail
delayed by 2,400 ms, on desktop and mobile. This tests latency beyond the text
deadline; it is not a complete Slow 4G throughput profile. Tests also cover the
actual creation-form nearby markers and the edit-form entrance search.

Validation: full `yarn.cmd lint` passed without errors or warnings. All 32 tests
in the popup, marker, navigation-target and geocoding Vitest suites passed; the
final popup-only rerun passed its 19 tests. Six affected Cypress scenarios passed
in focused runs: both form-map paths, late photos at 1280 and 390 px, and the
existing one-pan/cached-reopening cases at both widths. The complete featured
image Cypress suite was not rerun in this review iteration.

The deployed endpoint was checked again for entrances 1 and 120177: both still
return HTTP 200 with `featuredFile: null`. The live selected-photo browser check
remains pending; fixture-based image tests do not replace it. No production
content was modified to manufacture that scenario.

### Late photo movement review (2026-11-12)

After the text deadline, `dragstart` or `movestart` disables further autopan for
that opening. A late photo still decodes, appears and is measured, but respects
the chosen map view, even while dragging or after a deferred pan. Movements
caused by the popup's own update are ignored. Closing and reopening resets this
policy, and idle late-photo upgrades retain normal autopan.

Validation: full `yarn.cmd lint` passed without errors or warnings; the following
focused Vitest command passed 39 tests, using the default timeout:

```powershell
yarn.cmd test --run src/components/common/Maps/common/EntrancePopupImages.test.jsx src/hooks/queries/useEntranceFeaturedImage.test.jsx --maxWorkers=2
```

The popup tests cover both movement events, decoding 30 seconds past the text
deadline, deferred autopan cancellation, ignoring popup-generated movement,
resizing and reopening. Two Cypress regressions cover moved map positions at
1280 and 390 px. Local browser execution is pending: automatic approval review
rejected starting the local Vite server with `blocked by policy` and no further
reason. The live selected-photo smoke check remains pending as described above.
