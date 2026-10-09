# MapClusters

Map overlay system for the Grottocenter main map. Manages the cluster bubble layers
(entrances, networks, massifs), point markers, massif polygons, and the guided tour.

## Entrance filters

The general map uses the same predicate for high-zoom entrance markers and
low-zoom enriched coordinate tuples. Size codes are 1/2/3, quality zero means
insufficient, and interest compares displayed half stars. Missing interest is
hidden only when a positive minimum is selected.

`useEntranceFilters` owns the stored preferences, displayed-interest
normalization and reset. The control receives one filter object and imports its
fixed size/quality choices. Zoom changes only the representation: marker layers
and massif polygon visibility are derived from the current zoom and selected
layers, rather than synchronized across separate states.

`useEntranceClusters` owns one module Worker per map mount. Coordinates are
sent only when they change. The client coalesces filter updates while a build
is running, publishes only the latest index, and queries viewport clusters
and click expansion asynchronously. The index stops at zoom 12 because real
markers take over at 13. Each new index renews Leaflet bubbles and their click
handlers; viewport requests and unmounted workers cannot publish stale results.

Legacy cache compatibility: the worldwide entrance URL includes
`criteriaVersion=1` to separate enriched
responses from cached coordinate pairs. An offline upgrade can fall back to
the old URL: those pairs remain visible without filtering, with an explanatory
hint until updated coordinates arrive. The Worker checks the format once per
dataset and reports filter availability to the UI; ordinary filter predicates
receive validated tuples and do not contain legacy-cache branches.
Other layers and massif maps keep the
synchronous clustering path and their existing request URLs.

---

## Guided tour (`MapTour`)

The tour launches automatically the first time a user opens the map. It uses two storage
keys to track state:

| Key | Storage | Purpose |
| --- | --- | --- |
| `mapTourSeen` | `localStorage` | Permanent "don't show again" flag (set when user checks the box) |
| `mapTourSeenThisSession` | `sessionStorage` | Suppresses the tour for the rest of the current browser session |

### Reset the tour in dev

Open the browser console on the map page and run:

```js
localStorage.removeItem('mapTourSeen');
sessionStorage.removeItem('mapTourSeenThisSession');
location.reload();
```

The tour will launch again on the next page load.

### Disable the tour programmatically (dev only)

The variable is declared in `packages/web-app/.env` and defaults to `false`:

```env
REACT_APP_DISABLE_MAP_TOUR=false
```

Set it to `true` and restart the dev server to prevent the tour from launching regardless
of localStorage state. Override it locally via `.env.local` (git-ignored) to avoid
committing the change.

The constant `MAP_TOUR_DISABLED` in `index.jsx` reads this env variable at build time.
