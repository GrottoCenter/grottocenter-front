# MapClusters

Map overlay system for the GrottoCenter main map. Manages hexbin heat layers (entrances,
networks, massifs), point markers, massif polygons, and the guided tour.

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
