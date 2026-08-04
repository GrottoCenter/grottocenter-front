# GrottoCenter Front — Agent Guide

> AI agent and contributor reference for the GrottoCenter frontend.
> For web-app specifics (i18n, Redux, testing, deployment), see [`packages/web-app/AGENTS.md`](packages/web-app/AGENTS.md).

---

## 📋 Project Overview

**GrottoCenter Front** is the web frontend for GrottoCenter, an international collaborative database for speleology and caves.

- **Type**: React SPA · Yarn monorepo
- **License**: CC-BY-SA-3.0
- **Repository**: <https://github.com/GrottoCenter/grottocenter-front>
- **Backend API**: <https://github.com/GrottoCenter/grottocenter-api>
- **Production**: <https://fr.wikicaves.org/>
- **API Swagger UI**: <https://grottocenter.org/ui/api/1>
- **API raw spec**: <https://api.grottocenter.org/api/v1/swagger.yaml>

When checking API endpoints or schemas, fetch the raw spec with WebFetch. It is large — target specific paths or schema names.

---

## 🏗️ Architecture & Structure

```text
grottocenter-front/
├── packages/
│   ├── web-app/                      # Main React application
│   │   ├── src/
│   │   │   ├── actions/              # Redux action creators (by feature)
│   │   │   ├── reducers/             # Redux reducers (75+ reducers)
│   │   │   ├── components/
│   │   │   │   ├── appli/            # Complex components with logic (hooks/Redux)
│   │   │   │   └── common/           # Small, reusable UI components
│   │   │   ├── containers/           # ⚠️ DEPRECATED HOC components — use hooks instead
│   │   │   ├── pages/                # Page-level components (full-screen views)
│   │   │   ├── hooks/                # Custom GrottoCenter hooks
│   │   │   ├── helpers/              # ⚠️ DEPRECATED utilities — prefer hooks
│   │   │   ├── utils/                # Utilities (dates, strings, validation)
│   │   │   ├── conf/                 # Configuration (API routes, themes, i18n)
│   │   │   └── types/                # PropTypes definitions
│   │   ├── public/lang/              # i18n translation files (en.json, fr.json, …)
│   │   └── cypress/                  # E2E tests
│   ├── eslint-config/
│   ├── eslint-config-typescript/
│   ├── prettier-config/
│   └── ts-config/
├── scripts/                          # Build and utility scripts
├── .github/workflows/                # GitHub Actions CI/CD
└── .husky/                           # Git hooks (pre-commit, commit-msg)
```

**Feature organization is domain-driven**: Cave, Entrance, Document, Massif, Country/Region, Person/Caver, Description/History/Comment.

---

## 📚 GrottoCenter Vocabulary

Understanding the domain terminology is essential before writing any code.

### Entrance / Cave / Network

- A **cavity** = one **entrance** (the access point) + one **cave** (the volume behind it). Neither can exist without the other.
- A **network** = a **cave** linked to **2+ entrances**.
- An **entrance** is the physical opening to the outside — its interface with the air.

### Organization (not Grotto)

A **grotto** IS an **organization** — the term was renamed. The table is still `t_grotto` in the DB.

➡️ **Always use "organization"** in new code.

### Entrance (not Entry)

**Entry** was a mistranslation of "entrée". ➡️ **Always use "entrance"** in new code.

### Person / Caver

Persons are stored in `t_caver`. Two kinds:

1. **Users** — have an account (email + password). Can create/edit content, be declared authors, join organizations.
2. **Authors** — created by users to credit non-members. Their email looks like `1649883960918@mail.no`. No password. Can only be linked to documents.

### Roles & Permissions

A person can have 0, 1 or more roles (`t_group` table):

| Role              | Rights                                                 |
| ----------------- | ------------------------------------------------------ |
| **Administrator** | Application management (user rights, etc.)             |
| **Moderator**     | Content management (document validation, etc.)         |
| **Leader**        | Responsibilities for geographic areas or organizations |
| **User**          | Create and edit entities                               |

---

## 🛠️ Tech Stack

### Core

| Technology       | Usage                   |
| ---------------- | ----------------------- |
| **React 19**     | UI library              |
| **React Router** | Client-side routing     |
| **Redux 5**      | State management        |
| **React-Redux**  | Redux bindings          |
| **Redux-Thunk**  | Async action middleware |

### UI & Styling

| Technology                  | Usage             |
| --------------------------- | ----------------- |
| **MUI v7 (@mui/material)**  | Component library |
| **@emotion/react & styled** | CSS-in-JS         |
| **@mui/icons-material**     | Material icons    |
| **@mui/x-date-pickers**     | Date pickers      |

### Key Libraries

| Technology                  | Usage                   |
| --------------------------- | ----------------------- |
| **Leaflet / React-Leaflet** | Interactive maps        |
| **D3 + d3-hexbin**          | Data visualization      |
| **proj4**                   | Coordinate projections  |
| **React-Hook-Form**         | Form management         |
| **React-Intl**              | i18n                    |
| **date-fns**                | Date manipulation       |
| **Ramda**                   | Functional programming  |
| **Notistack**               | Notifications/toasts    |
| **@reactour/tour**          | Guided tours            |
| **Cypress**                 | E2E testing             |
| **Storybook**               | Component documentation |

---

## 📝 Code Conventions

### Component Definition

```javascript
// ✅ Arrow functions only
const ActionButton = ({ label, onClick, loading, disabled }) => (
  <Button onClick={onClick}>{label}</Button>
);

// ❌ No class components, no function keyword
```

### PropTypes

```javascript
import PropTypes from 'prop-types';

ActionButton.propTypes = {
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  icon: PropTypes.node
};
```

Use PropTypes for prop validation — not TypeScript on props. Be precise.

### Immutable State (Redux)

```javascript
// ✅
return { ...state, loading: true, data: action.payload };

// ❌ Never mutate
state.loading = true;
return state;
```

### Import Order

1. React and external libraries
2. Internal components
3. Utilities and helpers
4. Types and constants
5. Styles

### Path Aliases

The `@` alias resolves to `packages/web-app/src/`. **All new code must use it** for imports that would otherwise require two or more `../` segments.

```javascript
// ✅ New code
import { fetchCave } from '@/actions/Cave';
import CaveForm from '@/components/appli/CaveForm';

// ❌ Legacy — do not reproduce
import { fetchCave } from '../../../actions/Cave';
```

Existing `../` imports are left in place and migrated progressively (dedicated `tech/path-aliases` PR). Do not mix alias migration with feature or fix PRs.

### Naming Conventions

| Type                  | Convention                   | Examples                   |
| --------------------- | ---------------------------- | -------------------------- |
| Components            | PascalCase                   | `ActionButton`, `CaveForm` |
| Component files       | PascalCase.jsx               | `ActionButton.jsx`         |
| Variables / Functions | camelCase                    | `makeUrl`, `isLoading`     |
| Constants             | SCREAMING_SNAKE_CASE         | `FETCH_CAVE_SUCCESS`       |
| Action types          | SCREAMING_SNAKE_CASE         | `FETCH_CAVE`               |
| Booleans              | `is`, `has`, `should` prefix | `isDiving`, `hasError`     |
| Handlers              | `handle`, `on` prefix        | `handleClick`, `onSubmit`  |
| Reducers              | camelCase + Reducer          | `caveReducer`              |

### ESLint & Prettier

The project uses **ESLint 8 + Airbnb config**. Key custom rules:

- No trailing commas
- Arrow functions for named components
- `console.warn` / `console.error` OK — `console.log` is a warning

**Never use `// eslint-disable`** without a written justification in the preceding comment.

Prettier: single quotes, semicolons, 80-char width, 2-space indent, no trailing commas, `arrowParens: 'avoid'`.

---

## 🎯 Redux Patterns

### Action Structure

```javascript
export const FETCH_CAVE = 'FETCH_CAVE';
export const FETCH_CAVE_SUCCESS = 'FETCH_CAVE_SUCCESS';
export const FETCH_CAVE_FAILURE = 'FETCH_CAVE_FAILURE';

export const fetchCave = id => async dispatch => {
  dispatch({ type: FETCH_CAVE });
  try {
    const data = await fetch(`/api/caves/${id}`).then(r => r.json());
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

### Reducer Structure

```javascript
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
```

### Preferred: Hooks (not HOC containers)

```javascript
// ✅ Use hooks
const cave = useSelector(state => state.cave.data);
const dispatch = useDispatch();

// ❌ Deprecated: connect()
export default connect(mapStateToProps)(Component);
```

---

## 🔀 Git Workflow

### Branches

| Branch pattern | Purpose            |
| -------------- | ------------------ |
| `develop`      | Integration branch |
| `feat/<name>`  | New feature        |
| `fix/<name>`   | Bug fix            |
| `tech/<name>`  | Technical task     |

Always branch from an updated `develop`:

```bash
git checkout develop && git pull
git checkout -b feat/my-feature
```

### Commit Convention (CommitLint)

Format: `<type>(<scope>): <description>`

**Types**: `feat` `fix` `tech` `refactor` `improvement` `chore` `docs` `style` `test` `revert`

**Rules**:

- Scope is **required**, in `camelCase` or `PascalCase`
- Description lowercase, no trailing period

```bash
# ✅
feat(Cave): add filter by depth
fix(Map): correct polygon bounds calculation

# ❌
feat: add filter          # missing scope
feat(cave): add filter    # scope must be PascalCase/camelCase
feat(Cave): Add filter.   # capital + trailing period
```

### Pull Requests

Use the `.github/pull_request_template.md`. Create PRs targeting `develop`.

---

## 📦 NPM Scripts

```bash
yarn start                              # Vite dev server (port 3000)
yarn build                              # Vite production build (outputs to dist/)
yarn test                               # Vitest (unit tests)
yarn lint                               # ESLint check
yarn lint:fix                           # Auto-fix
yarn e2e:open                           # Cypress interactive
yarn e2e:run                            # Cypress headless
yarn storybook                          # Storybook on Vite (port 6007)
yarn translations:update-en             # Scan JSX and update en.json
yarn translations:sort                  # Sort one or several translation file alphabetically
yarn translations:sync-with-en         # Do or check sync with en.json
yarn outdated                           # Check outdated dependencies
```

---

## 🤖 AI Agent Checklist

Before submitting any change:

- [ ] `yarn lint` passes
- [ ] PropTypes defined for all new components
- [ ] i18n keys added to all lang files and sorted (see `packages/web-app/AGENTS.md`)
- [ ] Redux state never mutated directly
- [ ] Naming conventions respected
- [ ] Commit message conforms to CommitLint
- [ ] No `console.log` left in code
- [ ] No `// eslint-disable` without written justification
- [ ] E2E tests updated if new page or user-facing feature
- [ ] Storybook story created if new reusable component

### Patterns to Avoid

```javascript
// ❌ State mutation
state.caves.push(newCave);

// ❌ Missing PropTypes
const Component = ({ data }) => { ... };

// ❌ defaultProps — deprecated in React 19, use JS default parameters instead
Component.defaultProps = { data: null };
// ✅
const Component = ({ data = null }) => { ... };

// ❌ Hardcoded text (use i18n)
<Button>Save</Button>

// ❌ console.log
console.log('debug');

// ❌ Deprecated HOC pattern
export default connect(mapStateToProps)(Component);

// ❌ Adding to deprecated folders
import helper from '../../helpers/myHelper';
import MyContainer from '../../containers/MyContainer';

// ❌ Fragile Cypress selectors
cy.get('.MuiButton-root').click();
// ✅
cy.get('[data-testid="save-btn"]').click();

// ❌ Raw pixel values for ordinary spacing (bypasses the theme scale)
sx={{ mt: '12px', p: '4px' }}
// ✅ Use theme.spacing() factors — the theme uses the standard MUI scale
// (spacing: 8), so theme.spacing(factor) = factor * 8px. Fractional factors
// (0.25, 0.5, 1.5, ...) are valid and resolve correctly.
sx={{ mt: theme.spacing(1.5), p: theme.spacing(0.5) }}
// ✅ Shorthand props go through the same scale — prefer them over theme.spacing()
// when there's no other computation involved
sx={{ mt: 1.5, p: 0.5 }}
```

---

## 🔤 Typography

The root font-size is the **browser default (16px), so `1rem = 16px`**. The app
previously shipped Skeleton CSS's `html { font-size: 62.5% }` paired with MUI's
`htmlFontSize: 10` — that made `1rem = 10px` and silently rendered every
third-party stylesheet (Swagger UI, Leaflet plugins, …) at 62.5% of its intended
size. **Never reintroduce `htmlFontSize`.**

### Three heading roles — and no more

| Role             | Outline level | Visual scale | Component                      |
| ---------------- | ------------- | ------------ | ------------------------------ |
| Page title       | `h1`          | `h1`         | `PageTitle` (via `PageHeader`) |
| Section title    | `h2`          | `h2`         | `ScrollableContent` card title |
| Subsection title | `h3`          | `h5`         | `InfoSection`                  |

`h4`–`h6` are item-level headings inside a section (e.g. `Entry/SectionTitle`),
not new section roles.

`InfoSection` is the worked example of the split below: it labels a group of
properties, so it renders at the `h5` scale (16px/600) while staying at the `h3`
level in the outline. That is the same visual token as `FormSection` in the
entity forms, which labels the equivalent thing (a group of fields) — keep the
two in step.

```javascript
// ❌ Hard-coded font sizes — bypasses the scale
<Typography sx={{ fontSize: '1.4rem', fontWeight: 600 }}>Title</Typography>
// ✅ Use a variant; size AND weight come from the theme
<Typography variant="h3">Title</Typography>

// ❌ Picking a variant for its size, silently breaking the document outline
<Typography variant="h4">A section of an untitled card</Typography>
// ✅ `variant` = visual scale, `component` = document outline. Splitting them is
// correct and intended when a card has no title of its own.
<Typography variant="h3" component="h2">…</Typography>
```

Headings must stay monotonic (`h1 → h2 → h3`, never `h1 → h3`). `InfoSection`
takes a `component` prop (default `h3`) for exactly this reason.

### Fluid sizing

`clamp()` lives **only in the theme, and only on `h1`** (26→32px). It is the one
level whose range is wide enough for the stepping to be visible while resizing;
every level below spans two pixels at most, where a clamp costs a three-number
contract and buys nothing you can see. Always mix `rem` with `vw`
(`clamp(1.625rem, 1.46rem + 0.72vw, 2rem)`), never `vw` alone, or browser zoom
stops scaling the text (WCAG 1.4.4).

The resulting scale is a flat ladder — `32/23/20/18/16/14`, all at weight 600 —
so hierarchy is carried by size alone and can be checked at a glance.

**If you ever make another level fluid**, mind the invariant that bit us: it is
the fluid step's _minimum_, not its maximum, that must clear the static step
below it. `h1`'s floor is 26px precisely because `h2` sits at 23px. Get it wrong
and the hierarchy inverts on phones only — where two levels collapse to the same
size and the lower one, being no lighter, reads as the louder of the two.

> ⚠️ Do **not** wrap the theme in `responsiveFontSizes()`. Its `remFontSize <= 1`
> guard and its `min = 1 + (max - 1) / factor` formula are both anchored to a
> literal `1rem`, so what it does depends on the root font-size — it used to
> shrink body text to 13px below the `lg` breakpoint.

---

## 📚 References

- [Repository](https://github.com/GrottoCenter/grottocenter-front)
- [Wiki](https://github.com/GrottoCenter/grottocenter-front/wiki)
- [Backend API](https://github.com/GrottoCenter/grottocenter-api)
- [ESLint Airbnb](https://github.com/airbnb/javascript)
- [Redux Style Guide](https://redux.js.org/style-guide)
- [React-Intl](https://formatjs.io/docs/react-intl/)
- [MUI Docs](https://mui.com/)
- [Cypress Docs](https://docs.cypress.io/)
