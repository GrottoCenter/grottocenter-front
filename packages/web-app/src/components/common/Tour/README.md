# Tour — Guided Tour System

> User onboarding via step-by-step guided tours.
> Built with [@reactour/tour](https://github.com/elrumordelaluz/reactour) for tour logic and MUI for rendering.

## Architecture

```text
Tour/
  AppTour.jsx       ← generic TourProvider wrapper (shared config, zIndex, callback)
  TourTooltip.jsx   ← custom MUI ContentComponent — shared by all tours
```

Page-specific tours live next to their page/feature:

```text
Maps/MapClusters/
  MapTour.jsx        ← map steps → delegates to <AppTour>
```

## Adding a tour to a new page

### 1. Mark targets with `data-tour`

Add a `data-tour` attribute to each element you want to highlight:

```jsx
<MyButton data-tour="my-feature-button" />
```

### 2. Create `XxxTour.jsx`

Define steps and delegate to `AppTour`:

```jsx
import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import AppTour from '../../common/Tour/AppTour';

const XxxTour = ({ run, onEnd }) => {
  const { formatMessage } = useIntl();

  const steps = useMemo(
    () => [
      {
        selector: '[data-tour="my-feature-button"]',
        title: formatMessage({ id: 'Tour - My feature' }),
        content: formatMessage({ id: 'Tour - My feature description' }),
        position: 'bottom'
      }
    ],
    [formatMessage]
  );

  return <AppTour run={run} steps={steps} onEnd={onEnd} />;
};

XxxTour.propTypes = {
  run: PropTypes.bool.isRequired,
  onEnd: PropTypes.func.isRequired
};

export default XxxTour;
```

**Step fields:**

| Field | Type | Description |
| --- | --- | --- |
| `selector` | `string` | CSS selector targeting the highlighted element |
| `title` | `string` | Custom field read by `TourTooltip` |
| `content` | `string \| ReactNode` | Step body text |
| `position` | `'top' \| 'right' \| 'bottom' \| 'left' \| 'center'` | Popover placement |

### 3. Wire it in the page component

```jsx
const [runTour, setRunTour] = useState(false);

// trigger the tour from a button, a menu item, or any other event:
<button onClick={() => setRunTour(true)}>Start tour</button>

// tour instance (renders via portal to document.body):
<XxxTour run={runTour} onEnd={() => setRunTour(false)} />
```

### 4. Add i18n keys

Add all new keys to every lang file and sort them — see the [AI Agent i18n Workflow](../../../../../../AGENTS.md#ai-agent-i18n-workflow).

## Design rules

| Rule | Reason |
| ---- | ------ |
| `zIndex: 10000` on popover (set in `AppTour`) | Clears Leaflet controls and MUI modals |
| Prefer `data-tour` over CSS selectors | Stable across refactors; CSS selectors are only acceptable for third-party DOM |
| Steps defined with `useMemo` | Avoids re-creating the array on every render |
| `title` as a custom step field | `@reactour/tour` has no built-in title — `TourTooltip` reads `step.title` |

## Resetting a tour in development

Tours persist via `localStorage` (permanent "don't show again") and `sessionStorage` (per-session
suppression). To force a tour to reappear, clear the relevant keys from the browser console:

```js
// Reset the map tour (v1) — shows again on next page load
localStorage.removeItem('mapTourSeen_v1');
sessionStorage.removeItem('mapTourSeenThisSession_v1');
```

Each tour defines its own keys (see the constants at the top of the page component that renders the
tour). Alternatively, disable auto-launch entirely in dev without touching storage by setting
`REACT_APP_DISABLE_MAP_TOUR=true` in `.env.local` — the tour will never start automatically but
can still be triggered programmatically.

## Forcing a reset for all users (production)

Keys are versioned (`_v1`, `_v2`, …). To re-show a tour to every user after a significant content
update, bump the version constant in the page component:

```js
// index.jsx (MapClusters)
const MAP_TOUR_VERSION = 2; // ← was 1
```

Users' old `_v1` key is never read, so the tour launches again for everyone. No server-side
migration or cookie clearing required. Only bump the version when the tour content has changed
meaningfully — don't bump it for cosmetic or code-only changes.

## How AppTour works

`@reactour/tour` manages open/closed state internally via React context. `AppTour` uses a child component `TourSync` (inside the `TourProvider`) to bridge the external `run` prop to the internal `setIsOpen`/`setCurrentStep`. `beforeClose` on the Provider fires `onEnd()` whenever the tour closes (finish or skip).

## Future extension

For a multi-page or app-wide tour, add a Redux slice (`tourSlice`) with the active tour ID and current step index. `AppTour` can then read from the store instead of a local `run` prop.
