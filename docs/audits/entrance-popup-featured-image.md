# Entrance popup featured-image reads

Implements [frontend #1619](https://github.com/GrottoCenter/grottocenter-front/issues/1619),
assuming the contract in [API #1995](https://github.com/GrottoCenter/grottocenter-api/pull/1995)
is deployed.

## Cache behavior

- An uncached, active popup reads `/entrances/:id/featured-image` using the shared
  API client and the five-minute `STALE.STANDARD` tier.
- The lightweight key extends `entranceKeys.detail(id)`, so existing entrance
  invalidation and permanent deletion also cover popup metadata. A partial
  response never fills the full detail key.
- Fresh full detail is borrowed without copying it into the lightweight cache or
  renewing its age. Changes to that detail cache are observed so invalidation
  immediately enables a lightweight read, even while a popup is already open.
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
