# GrottoCenter Web App — Agent Guide

> Detailed reference for `packages/web-app`. Read alongside the [root AGENTS.md](../../AGENTS.md).

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

**3. Translate the values** — edit each lang file and replace the English fallback with the actual translation. Use a token efficient wayt to do it

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
    dispatch({ type: FETCH_CAVE_FAILURE, error: error.message });
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

### Unit — React Testing Library

```javascript
import { render, screen, fireEvent } from '@testing-library/react';

it('calls onClick when clicked', () => {
  const handleClick = jest.fn();
  render(<ActionButton label="Click me" onClick={handleClick} />);
  fireEvent.click(screen.getByText('Click me'));
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

### Storybook

```bash
yarn storybook    # port 6006
```

Create a story for every new reusable component:

```javascript
// ActionButton.stories.js
export default { title: 'Common/ActionButton', component: ActionButton };

export const Default = () => (
  <ActionButton label="Click me" onClick={() => {}} />
);
export const Loading = () => (
  <ActionButton label="Loading..." loading onClick={() => {}} />
);
export const Disabled = () => (
  <ActionButton label="Disabled" disabled onClick={() => {}} />
);
```

---

## 🌐 Environment Configuration

File: `packages/web-app/.env`

```bash
REACT_APP_API_URL=https://api.grottocenter.org
REACT_APP_OAI_URL=https://oai.grottocenter.org
REACT_APP_Z3950_URL=https://z3950.grottocenter.org
```

For local development:

```bash
REACT_APP_API_URL=http://localhost:3001
```

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

The app (`packages/web-app`) is deployed on **Azure Static Web Apps** from the `build/` folder.

- **Auto-deploy**: every push to `develop`
- **PR staging**: up to 3 PRs get a preview URL automatically

To test the production build locally:

```bash
npm install -g serve
cd packages/web-app
serve -s build
```
