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
If the Worker fails, the same engine runs synchronously on the main thread;
filters, cluster counts and click expansion keep working. This fallback can
block the UI while rebuilding a large index.

Legacy cache compatibility: the worldwide entrance URL includes
`criteriaVersion=1` to separate enriched responses from cached coordinate pairs.
An offline upgrade can fall back to the old URL: those pairs remain visible
without filtering, with an explanatory hint until updated coordinates arrive.
The map page refetches its datasets on reconnection. An enriched dataset enables
filters even if some entrances have malformed criteria or legacy pairs; those
individual entrances remain visible. Missing quality follows the same rule as
detailed markers. Other layers and massif maps keep the synchronous clustering
path and their existing request URLs.

---

## Entrance export

Right-click or long-press the map and choose **Export entrances in this area…**.
Keyboard users can focus the map and press Shift+F10 or the context-menu key.
The public online dialog defaults to GPX, and also offers
KML and GeoJSON. Its actions remain reachable in a narrow or landscape viewport.

The dialog explicitly states that all public entrances in the captured map
bounds are exported, ignoring size, data quality and interest filters. There is
no count preview or identifier list: Download calls the existing export endpoint
directly with latitude/longitude ranges and `isSensitive: false`. This keeps the
Typesense request short regardless of the number of entrances. The export also
works with the entrance layer hidden. It does not change the advanced-search form.
Crossing the antimeridian uses two ranges merged into one file. Complete files
are parsed and checked for valid points, links and bounds before downloading.
Closing the dialog cancels pending work and prevents a late download.

The API limits the export to 10,000 entrances; exceeding it asks the user to zoom.
There is no frontend surface-area limit. Empty, offline, invalid files and failed
requests have explicit feedback. Without a count preview, a syntactically valid
but truncated server export cannot be detected.
The shared map container disables leaflet-rotate's default right-button pitch
dragging so it cannot intercept the context menu.

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
VITE_DISABLE_MAP_TOUR=false
```

Set it to `true` and restart the dev server to prevent the tour from launching regardless
of localStorage state. Override it locally via `.env.local` (git-ignored) to avoid
committing the change.

The constant `MAP_TOUR_DISABLED` in `index.jsx` reads this env variable at build time.
