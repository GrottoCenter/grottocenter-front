# GrottoCenter Web App — Agent Guide

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
      <FormattedMessage id="Welcome to GrottoCenter" />
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

## 🎯 Redux Patterns (detailed)

See also root `AGENTS.md` for the short reference.

### Action Types Pattern

```javascript
// actions/Cave.js
export const FETCH_CAVE = 'FETCH_CAVE';
export const FETCH_CAVE_SUCCESS = 'FETCH_CAVE_SUCCESS';
export const FETCH_CAVE_FAILURE = 'FETCH_CAVE_FAILURE';

export const fetchCave = id => async dispatch => {
  dispatch({ type: FETCH_CAVE });
  try {
    const response = await fetch(`/api/caves/${id}`);
    const data = await response.json();
    dispatch({ type: FETCH_CAVE_SUCCESS, payload: data });
  } catch (error) {
    dispatch({
      type: FETCH_CAVE_FAILURE,
      error: {
        code: error.body?.code || null,
        message: error.body?.message || error.message,
        details: error.body?.metadata?.details || [],
        status: error.status || null
      }
    });
  }
};
```

### Reducer Pattern

The **NotificationsReducer** is the reference implementation — use its status pattern:

```javascript
// reducers/Cave.js
import {
  FETCH_CAVE,
  FETCH_CAVE_SUCCESS,
  FETCH_CAVE_FAILURE
} from '../actions/Cave';

const initialState = { data: null, loading: false, error: null };

const caveReducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_CAVE:
      return { ...state, loading: true, error: null };
    case FETCH_CAVE_SUCCESS:
      return { ...state, loading: false, data: action.payload };
    case FETCH_CAVE_FAILURE:
      return { ...state, loading: false, error: action.error };
    default:
      return state;
  }
};

export default caveReducer;
```

### Registering a new reducer

The root store is assembled in **`src/reducers/GCReducer.js`** via `combineReducers`. Adding a reducer requires two steps:

**1. Create the file** in `src/reducers/` following the naming convention `<Feature>Reducer.js` (PascalCase):

```javascript
// src/reducers/MyFeatureReducer.js
import { MY_FEATURE, MY_FEATURE_SUCCESS, MY_FEATURE_FAILURE } from '../actions/MyFeature';

const initialState = { data: null, loading: false, error: null };

const myFeatureReducer = (state = initialState, action) => {
  switch (action.type) {
    case MY_FEATURE:
      return { ...state, loading: true, error: null };
    case MY_FEATURE_SUCCESS:
      return { ...state, loading: false, data: action.payload };
    case MY_FEATURE_FAILURE:
      return { ...state, loading: false, error: action.error };
    default:
      return state;
  }
};

export default myFeatureReducer;
```

**2. Register it in `src/reducers/GCReducer.js`** — add the import and the key in `combineReducers` (keep alphabetical order):

```javascript
import myFeature from './MyFeatureReducer'; // add import

const GCReducer = combineReducers({
  // ...
  myFeature,   // add key — accessible as state.myFeature in useSelector
  // ...
});
```

The store is created in `src/pages/ApplicationShell.jsx` via `createStore(GCReducer, ...)` — you never need to touch that file when adding a reducer.

---

### Hooks vs HOC

```javascript
// ✅ Preferred: hooks
import { useSelector, useDispatch } from 'react-redux';

const CaveView = ({ id }) => {
  const dispatch = useDispatch();
  const cave = useSelector(state => state.cave.data);
  const loading = useSelector(state => state.cave.loading);

  useEffect(() => {
    dispatch(fetchCave(id));
  }, [dispatch, id]);
};

// ❌ Deprecated: connect()
export default connect(mapStateToProps, mapDispatchToProps)(CaveView);
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

Use `useOpenLink` (`src/hooks/useOpenLink.js`) whenever clicking an item links to an **internal app route** (`/ui/...`). It navigates in-app on mobile and opens a new tab on desktop. Never re-implement this logic manually.

> For genuine external URLs (e.g. external websites, mailto links), use `window.open` directly — `useOpenLink` is not for external links.

```javascript
import useOpenLink from '../hooks/useOpenLink';

const MyComponent = ({ url }) => {
  const openLink = useOpenLink();
  return <button onClick={() => openLink(url)}>Open</button>;
};
```

> ❌ Don't do this manually:

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
