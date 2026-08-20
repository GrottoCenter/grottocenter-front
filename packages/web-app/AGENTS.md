# Grottocenter Web App — Agent Guide

> Detailed reference for `packages/web-app`. Read alongside the [root AGENTS.md](../../AGENTS.md).

---

## 🗂️ Path Aliases

The `@` alias is configured in `vite.config.mjs` and points to `src/`. Use it in all new files for any import that would require two or more `../` hops.

```javascript
// ✅
import { fetchCave } from '@/actions/Cave';
import grottoTheme from '@/conf/grottoTheme';
import ActionButton from '@/components/common/ActionButton';

// ❌ Do not write new relative deep imports
import { fetchCave } from '../../../actions/Cave';
```

The alias also works in `vite.config.mjs` test configuration (Vitest resolves it via the same config). Existing `../` imports are migrated progressively in a dedicated `tech/path-aliases` PR — do not mix with feature or fix work.

---

## 📌 Pinned dependencies

`@mui/material` and `@mui/icons-material` are pinned to an exact **7.3.9** — do not
restore the `^` range without testing a swipe-to-close of the mobile side menu.

From 7.3.10, `Slide`'s `getTranslateValue` blanks the inline `transform` and calls
`getBoundingClientRect()` before restoring it. The forced reflow commits
`transform: none` as the transition's before-change style, so a drawer released
mid-swipe animates from the fully-open position instead of from the finger — the
panel visibly snaps back open before sliding out. Only `SwipeableDrawer` is
affected, since it is the only place a transform is applied outside `Slide`.

`@mui/lab` still asks for `^7.3.11`; the mismatch is patch-level and the peer
warning is expected.

> ⚠️ After changing any dependency version, restart the dev server with
> `yarn start --force` (or delete `node_modules/.vite`). A running server keeps
> serving its pre-bundled deps, so you will be testing the **old** version and
> get a false result — that is exactly how this bug was misdiagnosed once.

---

## 📁 src/hooks/ vs src/utils/

- **`src/hooks/`** — Custom React hooks only. Every file must export one or more functions whose name starts with `use`. No plain constants or pure utility functions.
- **`src/utils/`** — Pure utility modules: constants, helper functions, lookup tables. No React, no hooks. Examples: `documentTypeHelpers.js`, `subjectHelpers.js`.

Do not add non-hook utilities (constants, pure functions, icon maps) to `src/hooks/`.

---

## 🌍 Internationalization (i18n)

### Overview

- **Tool**: React-Intl
- **Translation management**: Transifex (auto-pulls to repo when a language reaches 100%)
- **Files**: `public/lang/<lang>.json` (e.g. `en.json`, `fr.json`, `es.json`)
- **Base language**: `en.json` — always the source of truth

### Agent i18n Workflow

When adding new UI strings, follow this exact sequence:

**1. Add new keys to `en.json`** — append at the end of the file (sort happens later):

```json
{
  "...existing keys...",
  "My new key": "My new value"
}
```

**2. Propagate to all other language files** using `sync-with-en` — this copies missing keys from `en.json` into every other lang file:

```bash
yarn translations:sync-with-en
```

**3. Translate the values** — edit each lang file and replace the English fallback with the actual translation. Use a token-efficient way to do it.

> ⚠️ **CRITICAL: Always translate in the target language.** Never leave English text in non-English language files. Every key in `fr.json` must have a French value, every key in `es.json` must have a Spanish value, etc. Using the English string as a placeholder in other languages is NOT acceptable — translate every value into the proper language for that file.

> ⚠️ **Encoding — NEVER introduce a BOM**: lang files must be UTF-8 **without** BOM.
>
> - Use the **Edit** or **Write** tool (safe — no BOM).
> - If you must use PowerShell to batch-write files, always use the BOM-free encoder:
>
>   ```powershell
>   $utf8NoBom = [System.Text.UTF8Encoding]::new($false)
>   [System.IO.File]::WriteAllText($path, $content, $utf8NoBom)
>   ```
>
> - **Never** use `[System.Text.Encoding]::UTF8` or `Out-File`/`Set-Content` without `-Encoding utf8` — both produce UTF-8 with BOM, which breaks JSON parsing in some environments.

**4. Sort all lang files** (mandatory — files must stay alphabetically ordered):

```bash
yarn translations:sort
```

### Using Translations in Components

```javascript
import { FormattedMessage, useIntl } from 'react-intl';

const MyComponent = () => {
  const { formatMessage } = useIntl();
  return (
    <div>
      <FormattedMessage id="Welcome to Grottocenter" />
      <input placeholder={formatMessage({ id: 'Search caves...' })} />
      <FormattedMessage id="Found {count} caves" values={{ count: 42 }} />
    </div>
  );
};
```

### Placeholders

Use ICU message format for dynamic values:

```json
{
  "distance.between.cities": "The distance between {city1} and {city2} is {distance} km."
}
```

---

## 🎯 Server state — React Query

All server reads (GET) and writes (POST/PUT/PATCH/DELETE) live in **TanStack
Query**. Redux is kept for genuine client/session state only —
see the [🎯 Redux Patterns](#-redux-patterns) section below for the
7 slices that remain. Rationale, tiers and offline contract are in
[docs/adr/0001-tanstack-query-server-state.md](../../docs/adr/0001-tanstack-query-server-state.md).

### Where to add a new endpoint

- **Query key** — `src/api/queryKeys.js`. `referenceKeys` for static
  reference lists; `xxxKeys` per entity domain (`documentKeys`, `caveKeys`,
  `massifKeys`, `entranceKeys`, `personKeys`, `organizationKeys`,
  `countryKeys`, `regionKeys`, `snapshotKeys`, `notificationKeys`,
  `countKeys`, `subscriptionKeys`, `messageKeys`, `moderationKeys`,
  `importKeys`, `listKeys`, `statsKeys`, `advancedSearchKeys`,
  `quicksearchKeys`, `duplicateKeys`). Every entity domain uses the same
  `detailKey(domain)` factory so `xxxKeys.all` is the prefix and
  `xxxKeys.detail(id)` extends it (`regionKeys.detail` composes on
  `(countryId, regionId)` because the API path is nested).
- **Query hook** — `src/hooks/queries/useXxx.js`. Return the raw
  `useQuery` object. Callers destructure with `= []`/`= null` fallbacks —
  wrappers that hide `refetch`/`isFetching`/`isPending` are not worth it.
- **Mutation hook** — `src/hooks/mutations/useYyyXxx.js`. `onSuccess`
  invalidates `xxxKeys.detail(id)` (or `removeQueries` on permanent
  delete). Any side effect the endpoint owns (list badge refresh, map tile
  invalidation, session cleanup) belongs in the same `onSuccess`.
- **Barrel** — re-export from `src/hooks/index.js` so consumers keep one
  import path.

Conventions (frozen):

- Options go in an object, not positional booleans:
  `useLicenses({ enabled: showAuthorization })`.
- Sorts and shape transforms go in `select`, at module scope so the
  identity is stable, on a copy so the cache array is never mutated.
- Cross-caller lookups (`findLicenseByName`, and future siblings) are
  colocated with their hook and re-exported from `hooks/index.js`.
- `apiGet/apiPost/apiPut/apiPatch/apiDelete` (JSON) and
  `apiGetWithRange`/`apiPostForm`/`apiPutForm` (paginated GETs, multipart
  uploads) in `src/api/client.js` are the only fetch entry points for RQ.
  They read the auth header at call time and throw errors with
  `body`/`status` attached — the QueryClient's global `onError`
  (dispatches `postLogout()` on 401) reads that shape.

Test provider: `src/test/renderWithProviders.jsx` mounts
`QueryClientProvider` on a fresh client per render with `retry:false`
and `networkMode:'always'` — use it for anything that reads from RQ.

### Shared mutation state across components (module singleton)

For flows where "current submitted state" is shared across a form + a
results component (the advanced-search page's SearchResults reads what
DocumentSearch/EntrancesSearch submitted), use a module-scope
`useSyncExternalStore` singleton next to the query hook — see
`src/hooks/queries/useAdvancedSearch.js`. One advanced search is active
app-wide at any time, so a module singleton matches the semantics
without threading a React context through the tree.

## 🎯 Redux Patterns

Redux keeps only genuine client/session state. **Do not add a new
reducer for a server fetch** — server-state (`{ data, loading, error }`
for an API response) belongs in React Query.

Remaining slices (7):

- `account` — mirror of the current user's account object (name, email,
  language, prefs). Reads live in Redux; writes go through `useUpdateAccount`
  and re-fetch `fetchAccount` on success.
- `login` — session/JWT, authorization header, login-dialog visibility,
  MFA transition flags. Load-bearing across the auth flows in
  `hooks/mutations/useAuthFlows.js` and `useMfa.js` — the mutations
  dispatch back into this slice on success.
- `intl` — locale + loaded message catalogues. Locale changes are
  driven by `changeLocale`; account language sync writes back via
  `useUpdateAccount`.
- `sideMenu` — open/closed state of the AppShell side menu.
- `error` — global error banner state (rare, mostly used by legacy
  error boundaries).
- `map` — viewport map: continuous-bounds fetches (`actions/Map.js`) are
  a carve-out per the ADR (unbounded cache keys). The tile cache
  (`utils/mapTileCache.js`) stays here.
- `importWizard` — multi-step observation-import wizard. Client-state:
  file/encoding/header row/column mappings/context/wizard step. The
  wizard has small server-state sub-fetches (`fetchSensorConfigs`,
  submission status) that also live here to keep the step transitions
  atomic — they are not new endpoints, so leaving them in Redux is not
  a regression.

Anything else that looks like "load, hold, invalidate" is a React Query
job — see the section above.

---

### Hooks vs HOC

```javascript
// ✅ Preferred: hooks — Redux for client-state
import { useSelector, useDispatch } from 'react-redux';

const AppShell = () => {
  const dispatch = useDispatch();
  const { isOpen } = useSelector(state => state.sideMenu);
  return <SideMenu open={isOpen} onToggle={() => dispatch(toggleSideMenu())} />;
};

// ❌ Deprecated: connect()
export default connect(mapStateToProps, mapDispatchToProps)(AppShell);
```

For server-state (a cave, a document, …), use the React Query hook —
see the "Server state" section above:

```javascript
import { useCave } from '../hooks';

const CaveView = ({ id }) => {
  const { data: cave, isPending, error } = useCave(id);
  // …
};
```

---

## ⚠️ Error Handling (API Errors)

### Error Object Shape

`checkAndGetStatus` (in `src/actions/utils.js`) attaches the parsed response body and HTTP status to thrown errors:

```javascript
error.message  // body.message || status code
error.body     // full parsed JSON response (code, message, metadata, reference_id)
error.status   // HTTP status code (400, 404, 409, 500, etc.)
```

### Dispatching Structured Errors

Always preserve the error structure in failure actions:

```javascript
.catch(error => {
  if (error.isAuthError) return;
  dispatch({
    type: ACTION_FAILURE,
    error: {
      code: error.body?.code || null,
      message: error.body?.message || error.message,
      details: error.body?.metadata?.details || [],
      status: error.status || null
    }
  });
});
```

### Displaying Errors to Users

Use `useNotification()` (notistack toasts) — the preferred pattern:

```javascript
import { useNotification } from '../../hooks';

const { onError } = useNotification();

useEffect(() => {
  if (!error) return;
  const { code, message } = error;
  const toastMessage = code
    ? formatMessage({ id: code, defaultMessage: message || fallbackMessage })
    : message || formatMessage({ id: 'unexpected error' });
  onError(toastMessage);
}, [error]);
```

**Rules:**

- Use the error **code** as the `formatMessage` id (allows localized error messages)
- Fall back to the raw API **message** via `defaultMessage`
- When `details[]` is present (field-level validation), show inline with `<Alert>` + `<List>` (toasts can't display lists)
- For 500 errors, show a generic "server error" toast — never expose internal details
- Add i18n keys for each error code (e.g., `"IMPORT_VALIDATION_ERROR": "Profile validation failed."`) to all lang files

### Anti-Patterns

```javascript
// ❌ Discards structured error — loses code and details
dispatch({ type: FAILURE, error: error.message });

// ❌ Showing raw API message without i18n fallback
<Alert>{error.message}</Alert>

// ❌ Exposing 500 error internals to the user
onError(error.body?.message); // might contain stack traces
```

---

## 🧪 Testing

### E2E — Cypress

```bash
yarn start          # start the app first
yarn e2e:open       # interactive mode
yarn e2e:run        # headless
```

Best practices:

- Use `data-testid` attributes for selectors — never CSS class selectors
- Use `cy.intercept()` to mock API calls
- Tests must be isolated and independent

```javascript
describe('Cave page', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('navigates to cave page', () => {
    cy.get('[data-testid="cave-link"]').click();
    cy.url().should('include', '/caves');
  });
});
```

### Unit — Vitest + React Testing Library

Tests run on **Vitest** (`yarn test`, jsdom env, globals enabled — `describe`,
`it`, `expect`, `vi` need no import). Use `vi.*` instead of `jest.*`. When a
factory mocks a module imported as `default`, return `{ default: ... }`. Prefer
top-level ESM `import` over `require()` inside tests (`vi.mock` is hoisted, so the
import already receives the mock).

```javascript
import { render, screen, fireEvent } from '@testing-library/react';

it('calls onClick when clicked', () => {
  const handleClick = vi.fn();
  render(<ActionButton label="Click me" onClick={handleClick} />);
  fireEvent.click(screen.getByText('Click me'));
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

### Storybook

Storybook runs on the **Vite builder** (`@storybook/react-vite`, Storybook 9+) and
reuses the project `vite.config.mjs`. Stories use the **CSF3** format (object
exports), not the legacy `storiesOf` API.

```bash
yarn storybook    # port 6007
```

Create a story for every new reusable component (named default export to satisfy
`import/no-anonymous-default-export`):

```javascript
// ActionButton.stories.jsx  (or _stories.jsx)
import ActionButton from './index';

const meta = { title: 'Common/ActionButton', component: ActionButton };
export default meta;

export const Default = { args: { label: 'Click me', onClick: () => {} } };
export const Loading = { args: { label: 'Loading...', loading: true } };
export const Disabled = { args: { label: 'Disabled', disabled: true } };
```

Controls replace the removed `addon-knobs`; use `args` + `argTypes`. Actions come
from `storybook/actions` (`import { action } from 'storybook/actions'`).

---

## 🌐 Environment Configuration

File: `packages/web-app/.env`

Vite only exposes variables prefixed with `VITE_`, read via `import.meta.env` (not
`process.env`).

```bash
VITE_API_URL=https://api.grottocenter.org
VITE_OAI_URL=https://oai.grottocenter.org
VITE_Z3950_URL=https://z3950.grottocenter.org
```

For local development:

```bash
VITE_API_URL=http://localhost:3001
```

In code: `import.meta.env.VITE_API_URL`. Types are declared in `src/vite-env.d.ts`.

---

## 🎨 UI / UX Patterns

### Accessibility (a11y)

```javascript
// Always associate labels with inputs
<label htmlFor="cave-name">Cave Name</label>
<input id="cave-name" {...register('name')} />

// ARIA for complex interactions
<button aria-label="Close dialog" onClick={onClose}>×</button>
```

### Responsive Design

```javascript
import { useTheme, useMediaQuery } from '@mui/material';

const MyComponent = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  return isMobile ? <MobileView /> : <DesktopView />;
};
```

### Navigation (mobile vs desktop)

`AppLink` (`src/components/common/AppLink.jsx`) is the single link component for the whole app. Default choice whenever you render something that looks/behaves like a link — text links, buttons, cards, list items. It renders a real `<a>` / React Router `<Link>`, so keyboard focus, Enter, ctrl/middle-click and right-click "open in new tab" all work for free. Never build a link out of a `<span role="button">` or a plain `onClick`.

Contract — the prop you pass is the signal:

- `to="/ui/..."` → internal route. Always in-app on mobile. On desktop it stays in the **same tab** unless you pass `openInNewTabDesktop`.
- `href="https://..."` → external URL. Always opens in a **new tab**.

```javascript
import AppLink from '../common/AppLink';

// Internal, same tab on desktop (default)
<AppLink to={`/ui/entrances/${id}`}>{name}</AppLink>

// Internal, explicit new tab on desktop (e.g. "open in new tab" affordance)
<AppLink to={url} openInNewTabDesktop>{label}</AppLink>

// External
<AppLink href="https://example.org">{label}</AppLink>
```

Use it directly for links, or via `component=` on any polymorphic MUI component (`Button`, `MenuItem`, `ListItem`, `CardActionArea`, `Link`) instead of an `onClick` handler:

```javascript
// ✅
<Button component={AppLink} to={`/ui/entrances/${id}`}>Discover</Button>

// ❌ Don't wire navigation through onClick when the element could be a real link
<Button onClick={() => navigate(`/ui/entrances/${id}`)}>Discover</Button>
```

`useOpenLink` (`src/hooks/useOpenLink.js`) is the **imperative** fallback — a callback that navigates in-app on mobile and opens a new tab on desktop. Reach for it only when the target genuinely can't be an anchor: table rows (`<tr>` can't render as `<a>`), a `MenuItem`/action list mixing navigation with non-navigation actions (edit, delete), or a Leaflet marker rendered outside React's tree. If the clickable element can be an `AppLink` (or `component={AppLink}`), prefer that.

```javascript
import useOpenLink from '../hooks/useOpenLink';

// Only for non-anchor-able elements (e.g. a whole <TableRow>)
const openLink = useOpenLink();
<TableRow onClick={() => openLink(url)}>...</TableRow>;
```

> ❌ Don't do this manually, whether with `AppLink` or `useOpenLink` available:

```javascript
if (isMobile) navigate(url);
else window.open(url, '_blank');
```

### Performance

```javascript
// Memoize expensive components
const ExpensiveComponent = React.memo(({ data }) => { ... });

// Memoize values and callbacks
const sortedCaves = useMemo(() => caves.sort((a, b) => a.depth - b.depth), [caves]);
const handleClick = useCallback(() => dispatch(fetchCave(id)), [dispatch, id]);

// Lazy-load heavy components
const CaveMap = React.lazy(() => import('./components/CaveMap'));
```

### Form Management (React Hook Form)

**Rule — RHF vs Redux:**

| Concern                                  | Tool                                               |
| ---------------------------------------- | -------------------------------------------------- |
| Field values, validation, errors         | **React Hook Form** (`useForm`)                    |
| API loading state, submit error          | **Redux**                                          |
| Pre-fill data loaded from API            | **Redux** → passed as `defaultValues` to `useForm` |
| State shared across unrelated components | **Redux**                                          |

> ❌ Never store field values in Redux state.  
> ❌ Never use React Hook Form for state that must survive navigation.  
> ⚠️ Some existing forms (e.g. `Document/FormContent.jsx`) mix both — this is tech debt to fix progressively, not reproduce.

```javascript
import { useForm } from 'react-hook-form';

const CaveForm = ({ onSubmit }) => {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm();
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name', { required: 'Name is required' })} />
      {errors.name && <span>{errors.name.message}</span>}
      <button type="submit">Save</button>
    </form>
  );
};
```

### Mapping (Leaflet)

```javascript
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

const CaveMap = ({ caves }) => (
  <MapContainer center={[45.5, 6.5]} zoom={10}>
    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
    {caves.map(cave => (
      <Marker key={cave.id} position={[cave.lat, cave.lng]}>
        <Popup>{cave.name}</Popup>
      </Marker>
    ))}
  </MapContainer>
);
```

Important:

- Always define a CSS `height` for the map container
- Clean up event listeners in `useEffect`
- Use `useMemo` for large marker collections

---

## 🗺️ Guided Tour System

Tours use **@reactour/tour** for logic and **MUI** for rendering.

### File Structure

```text
src/components/common/Tour/
  AppTour.jsx        ← TourProvider wrapper (shared config, zIndex, callback)
  TourTooltip.jsx    ← Custom MUI ContentComponent (Card + Typography + Button)
  TourTrigger.jsx    ← ? icon button, usable on any page

src/components/common/Maps/MapClusters/
  MapTour.jsx        ← Map-specific steps → delegates to <AppTour>
  MapTourControl.jsx ← TourTrigger wrapped as a Leaflet CustomControl
```

### Adding a Tour to a New Page

1. Create `XxxTour.jsx` with steps using `<AppTour>`:

   ```jsx
   import AppTour from '../../common/Tour/AppTour';

   const XxxTour = ({ run, onEnd }) => {
     const { formatMessage } = useIntl();
     const steps = useMemo(
       () => [
         {
           selector: '[data-tour="my-element"]',
           title: formatMessage({ id: 'Tour - My title' }),
           content: formatMessage({ id: 'Tour - My description' }),
           position: 'bottom'
         }
         // eslint-disable-next-line react-hooks/exhaustive-deps
       ],
       []
     );
     return <AppTour run={run} steps={steps} onEnd={onEnd} />;
   };
   ```

   Step fields: `selector`, `title` (custom — read by `TourTooltip`), `content`, `position` (`top|right|bottom|left|center`).

2. Add `data-tour="my-element"` to the target DOM element.

3. Add `<TourTrigger onStart={...} />` and `<XxxTour run={runTour} onEnd={() => setRunTour(false)} />` in the page component with a `runTour` state.

4. Add i18n keys to all lang files and sort them.

### Design Rules

- `zIndex: 10000` in `AppTour` clears Leaflet controls and MUI modals
- Prefer `data-tour` attributes over CSS selectors for stability
- Steps in `useMemo` to avoid recreating the array on every render
- `title` is a custom field — `@reactour/tour` has no built-in title; `TourTooltip` reads `step.title`

---

## 🚀 Azure Deployment

The app (`packages/web-app`) is built by **Vite** and deployed on **Azure Static
Web Apps** from the `dist/` folder.

- **Auto-deploy**: every push to `develop`
- **PR staging**: up to 3 PRs get a preview URL automatically

To test the production build locally:

```bash
cd packages/web-app
yarn build           # outputs to dist/
yarn preview         # serves dist/ on a local Vite preview server
```
