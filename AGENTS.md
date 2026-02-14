# AGENTS.md - GrottoCenter Front Development Guide

> Documentation for AI agents and developers working on the GrottoCenter frontend.
> Last updated: 2026-02-13

## 📋 Project Overview

**GrottoCenter Front** is the web frontend application for the GrottoCenter project, an international collaborative database for speleology and caves.

- **Type**: React SPA (Single Page Application)
- **Architecture**: Yarn monorepo with workspaces
- **License**: CC-BY-SA-3.0
- **Repository**: <https://github.com/GrottoCenter/grottocenter-front>
- **Wiki**: <https://github.com/GrottoCenter/grottocenter-front/wiki>
- **Backend API**: <https://github.com/GrottoCenter/grottocenter-api>
- **Production Site**: <https://fr.wikicaves.org/>
- **Status**: <https://uptime.betterstack.com> (monitoring)

---

## 🏗️ Architecture & Structure

### Monorepo Structure

```
grottocenter-front/
├── packages/
│   ├── web-app/                      # Main React application
│   │   ├── src/
│   │   │   ├── actions/              # Redux action creators (by feature)
│   │   │   ├── reducers/             # Redux reducers (75+ reducers)
│   │   │   ├── components/
│   │   │   │   ├── appli/           # Complex reusable components with logic
│   │   │   │   └── common/          # Small, basic, reusable UI components
│   │   │   ├── containers/           # ⚠️ DEPRECATED HOC components (use hooks instead)
│   │   │   ├── pages/                # Page-level components (full-screen views)
│   │   │   ├── hooks/                # Custom GrottoCenter hooks
│   │   │   ├── helpers/              # ⚠️ DEPRECATED utilities (prefer hooks)
│   │   │   ├── util/                 # Utilities (dates, strings, validation)
│   │   │   ├── conf/                 # Configuration (API routes, themes, i18n)
│   │   │   └── types/                # PropTypes definitions
│   │   ├── public/
│   │   │   └── lang/                # i18n translation files
│   │   └── cypress/                  # E2E tests
│   │
│   ├── eslint-config/                # Shared ESLint configuration
│   ├── eslint-config-typescript/     # TypeScript-specific ESLint rules
│   ├── prettier-config/              # Shared Prettier configuration
│   └── ts-config/                    # Shared TypeScript configuration
│
├── scripts/                          # Build and utility scripts
├── .github/workflows/                # GitHub Actions CI/CD
└── .husky/                          # Git hooks (pre-commit, commit-msg)
```

### Folder Structure Details

- **actions/** ➡️ Redux actions
- **components/appli/** ➡️ Complex reusable components, wrapping graphical components and adding logic (via Hook or Redux)
- **components/common/** ➡️ Small, basic, reusable components
- **conf/** ➡️ Configuration files
- **containers/** ➡️ ⚠️ **DEPRECATED** old HOC components (use React hooks instead of High-Order-Component)
- **helpers/** ➡️ ⚠️ **DEPRECATED** not really used anymore, prefer hooks instead
- **hooks/** ➡️ Custom GrottoCenter hooks
- **pages/** ➡️ Complex components displayed as pages (main purpose of a URL, taking all screen space)
- **reducers/** ➡️ Redux reducers

### Feature Organization (Domain-Driven)

Features are organized by **business entity**:

- **Cave**: Actions, reducers, components for caves
- **Entrance**: Cave entrance management
- **Document**: Documents attached to entities
- **Massif**: Mountain massif management
- **Country/Region**: Geographic data
- **Person/Caver**: Speleologists and contributors management
- **Description/History/Comment**: Descriptive data

---

## 📚 GrottoCenter Vocabulary

Understanding the project's specific terminology is essential:

### Entrances / Caves / Networks

- A **cavity** corresponds in the database to one **entrance** (the entry point) + one **cave** (what is behind this entry point). An entrance object without a cave cannot exist. Not the opposite either!
- When we talk about a **network**, it is, in the database, a **cave** which is associated with **several entrances** (at least 2).
- An **entrance** is a point from which a cavity is accessible from the outside, its interface with the air.

### Organization (not Grotto)

Very simple: a **grotto** IS an **organization**. We just changed the term used. An organization can refer to many entities in GrottoCenter: a caving club, a publisher, a bookshop, a university, etc.

**Grotto** is still used in some parts of the code because of the database schema (`t_grotto` table).

➡️ **Always use "organization" when developing new features.**

### Entrance (not Entry)

**Entrance** is now used to mean "the entrance of a cave". **Entry** was a bad translation of the French word "entrée".

➡️ **Always use "entrance" when developing new features.**

### Person / Caver

**Person** means a person that exists in GrottoCenter. Persons are listed in the `t_caver` table. There are two categories of persons:

1. **Users** who have created an account using a unique email in GrottoCenter and a password. Users can:
   - Create and edit content
   - Be declared author of a document by other users or by themselves
   - Associate with organizations or cavities

2. **Authors** that have been created by users in order to declare them author of a document while they were not yet part of the existing people in GrottoCenter. Authors:
   - Have an email in the form `1649883960918@mail.no`
   - Do not have a password
   - Can only be associated to a document as an author

### Roles & Permissions

A person can have 0, 1 or more roles (`t_group` table). Each role has different rights:

- **Administrators**: Rights associated with application management (e.g., user rights management)
- **Moderators**: Rights associated with site content management (e.g., document validation submitted by users)
- **Leaders**: Rights associated with responsibilities for geographic areas or an organization (e.g., receiving notifications when changes occur in a specific geographic area)
- **Users**: Rights associated with the creation and editing of entities on GrottoCenter

---

## 🛠️ Technologies & Stack

### Framework & Core

| Technology | Version | Usage |
| ---------- | ------- | ----- |
| **React** | 19.2.0 | UI library |
| **React Router** | 7.9.6 | Client-side routing |
| **Redux** | 5.0.1 | State management |
| **React-Redux** | 9.2.0 | Redux bindings for React |
| **Redux-Thunk** | 3.1.0 | Async action middleware |

### UI & Styling

| Technology | Version | Usage |
| ---------- | ------- | ----- |
| **Material-UI (@mui/material)** | 7.3.5 | Component library |
| **@emotion/react & @emotion/styled** | 11.14 | CSS-in-JS styling |
| **@mui/icons-material** | 7.3.5 | Material icons |
| **@mui/x-date-pickers** | 8.19.0 | Date picker components |

### Mapping & Geospatial

| Technology | Version | Usage |
| ---------- | ------- | ----- |
| **Leaflet** | 1.9.4 | Interactive maps |
| **React-Leaflet** | 5.0.0 | React wrapper for Leaflet |
| **Leaflet-Draw** | 1.0.4 | Drawing tools on maps |
| **D3** | 7.9.0 | Data visualization |
| **d3-hexbin** | 0.2.2 | Hexagonal binning for maps |
| **proj4** | 2.20.2 | Coordinate projections |

### Utilities

| Technology | Version | Usage |
| ---------- | ------- | ----- |
| **Ramda** | 0.32.0 | Functional programming |
| **date-fns** | 4.1.0 | Date manipulation |
| **React-Hook-Form** | 7.67.0 | Form management |
| **React-Intl** | 7.1.14 | Internationalization (i18n) |
| **Notistack** | 3.0.2 | Notifications/toasts |

### Dev Tools & Testing

| Technology | Version | Usage |
| ---------- | ------- | ----- |
| **Cypress** | 15.7.0 | E2E testing |
| **Storybook** | 8.6.14 | Component documentation |
| **@testing-library/react** | 16.3.0 | Component testing |
| **ESLint** | 8.57.1 | Code linter |
| **Prettier** | 3.7.3 | Code formatter |
| **TypeScript** | 5.9.3 | Type checking |
| **Husky** | 9.1.7 | Git hooks |
| **Lint-Staged** | 16.2.7 | Pre-commit linting |
| **CommitLint** | 20.1.0 | Commit message validation |

---

## 🔧 Development Tools

### IDE Setup

**Recommended IDEs**:

- **VSCode** (recommended)
- **WebStorm**

**Required IDE Extensions**:

For **VSCode**:

- [Prettier - Code formatter](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [ES7+ React/Redux/React-Native snippets](https://marketplace.visualstudio.com/items?itemName=dsznajder.es7-react-js-snippets)

### Browser Extensions

**Essential for development**:

- **React Developer Tools**
  - Firefox: <https://addons.mozilla.org/en-US/firefox/addon/react-devtools/>
  - Chrome: <https://chrome.google.com/webstore/detail/react-developer-tools>
  - Inspect React components, props, and state from your browser

- **Redux DevTools**
  - Firefox: <https://addons.mozilla.org/en-US/firefox/addon/reduxdevtools/>
  - Chrome: <https://chrome.google.com/webstore/detail/redux-devtools>
  - Time-travel debugging for Redux state

---

## 📝 Code Conventions

### JavaScript/React Style

#### 1. Component Definition

##### ✅ ALWAYS use arrow functions for components

```javascript
// ✅ GOOD
const ActionButton = ({ label, onClick, loading, disabled }) => {
  return <Button onClick={onClick}>{label}</Button>;
};

// ❌ BAD - No class components
class ActionButton extends React.Component { ... }

// ❌ BAD - No function keyword
function ActionButton() { ... }
```

#### 2. PropTypes

**Use PropTypes for prop validation** (not TypeScript on props)

```javascript
import PropTypes from 'prop-types';

const ActionButton = ({ label, onClick, icon }) => { ... };

ActionButton.propTypes = {
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  icon: PropTypes.node
};
```

**⚠️ Be precise about your component's PropTypes.**

#### 3. Destructuring

##### Use destructuring systematically

```javascript
// ✅ GOOD - Destructuring in parameters
const Component = ({ user, onSave, isLoading = false, ...restProps }) => {
  const { name, email } = user;
  return <div {...restProps}>{name}</div>;
};

// ❌ BAD - Access via props.
const Component = (props) => {
  return <div>{props.user.name}</div>;
};
```

#### 4. Immutable State

##### ALWAYS treat state as immutable

```javascript
// ✅ GOOD - Spread operator to copy
return {
  ...state,
  loading: true,
  error: null,
  data: state.data.map(item =>
    item.id === action.id ? { ...item, ...action.payload } : item
  )
};

// ❌ BAD - Direct mutation
state.loading = true;
return state;
```

#### 5. Import Order

**Order of imports**:
1. React and external libraries
2. Internal components
3. Utilities and helpers
4. Types and constants
5. Styles

```javascript
// 1. React and external
import React from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { Button, TextField } from '@mui/material';

// 2. Components
import ActionButton from '../common/ActionButton';

// 3. Utilities
import { validateLatLong } from '../../helpers/validator';

// 4. Types and constants
import { FETCH_CAVE } from '../../conf/actionTypes';

// 5. Styles
import './styles.css';
```

### Naming Conventions

| Type | Convention | Examples |
|------|-----------|----------|
| **Components** | PascalCase | `ActionButton`, `CaveForm`, `MapView` |
| **Component files** | PascalCase.jsx | `ActionButton.jsx`, `CaveForm.jsx` |
| **Variables/Functions** | camelCase | `makeUrl`, `validateLatLong`, `isLoading` |
| **Constants** | SCREAMING_SNAKE_CASE | `FETCH_CAVE_SUCCESS`, `API_BASE_URL` |
| **Action Types** | SCREAMING_SNAKE_CASE | `FETCH_CAVE`, `UPDATE_ENTRANCE_SUCCESS` |
| **Booleans** | Prefix `is`, `has`, `should` | `isDiving`, `hasError`, `shouldUpdate` |
| **Handlers** | Prefix `handle`, `on` | `handleClick`, `onSubmit` |
| **Reducers** | camelCase + Reducer | `caveReducer`, `entranceReducer` |

### ESLint Configuration

The project uses **ESLint 8.57.1** with **Airbnb** config extended:

```javascript
{
  extends: [
    'eslint:recommended',
    'airbnb',
    'airbnb/hooks',
    'prettier',
    'plugin:cypress/recommended',
    'plugin:storybook/recommended'
  ],
  rules: {
    // Important custom rules
    'brace-style': 'error',                    // Brace style
    'comma-dangle': ['error', 'never'],        // No trailing comma
    'no-console': ['warn', { allow: ['warn', 'error'] }], // console.warn/error OK

    // React
    'react/require-default-props': 'off',      // defaultProps optional
    'react/jsx-props-no-spreading': 'off',     // Spread props allowed
    'react/function-component-definition': [2, { namedComponents: 'arrow-function' }],

    // Prettier
    'prettier/prettier': 'error'               // Error if format incorrect
  }
}
```

**⚠️ IMPORTANT**: Don't use `// eslint-disable` comments without an excellent reason. Moreover, the reason must be explicitly written in a comment before the rule disabling. **ESLint is your friend, not your enemy: don't ignore its warnings** 😉

### Prettier Configuration

```javascript
{
  semi: true,                 // Semicolon required
  singleQuote: true,         // Single quotes
  printWidth: 80,            // Max width 80 characters
  tabWidth: 2,               // Indentation 2 spaces
  useTabs: false,            // Spaces (no tabs)
  trailingComma: 'none',     // No trailing comma
  bracketSpacing: true,      // Spaces in objects { foo: bar }
  jsxBracketSameLine: true,  // JSX > on same line
  arrowParens: 'avoid'       // No parentheses if 1 param: x => x
}
```

---

## 🎯 Redux Patterns

### Action Structure

```javascript
// Action types constants
export const FETCH_CAVE = 'FETCH_CAVE';
export const FETCH_CAVE_SUCCESS = 'FETCH_CAVE_SUCCESS';
export const FETCH_CAVE_FAILURE = 'FETCH_CAVE_FAILURE';

// Action creators with Redux Thunk
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

### Reducer Structure

**File example** (following best practices): **NotificationsReducer** ➡️ Use Reducer status pattern

```javascript
import { FETCH_CAVE, FETCH_CAVE_SUCCESS, FETCH_CAVE_FAILURE } from '../actions/Cave';

const initialState = {
  data: null,
  loading: false,
  error: null
};

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

### Container Component Pattern

**⚠️ DEPRECATED**: Use React hooks instead of HOC containers.

```javascript
// OLD WAY (deprecated) - Container with connect()
import { connect } from 'react-redux';
import { fetchCave } from '../../actions/Cave';
import CaveView from '../../components/appli/CaveView';

const mapStateToProps = state => ({
  cave: state.cave.data,
  loading: state.cave.loading
});

const mapDispatchToProps = {
  fetchCave
};

export default connect(mapStateToProps, mapDispatchToProps)(CaveView);

// ✅ NEW WAY (preferred) - Using hooks
import { useSelector, useDispatch } from 'react-redux';
import { fetchCave } from '../../actions/Cave';

const CaveView = () => {
  const dispatch = useDispatch();
  const cave = useSelector(state => state.cave.data);
  const loading = useSelector(state => state.cave.loading);

  useEffect(() => {
    dispatch(fetchCave(id));
  }, [dispatch, id]);

  // Component logic...
};
```

---

## 🌍 Internationalization (i18n)

### Overview

GrottoCenter uses **Transifex** for the translation process. Translations are managed via React-Intl.

### Translation Files

- Location: `packages/web-app/public/lang/`
- Format: `<lang>.json` (e.g., `en.json`, `fr.json`, `es.json`)
- Base language: **English** (`en.json`)

### For Developers

#### Adding Translatable Strings

When submitting a Pull Request, **update the `lang/en.json` file** with the new keys you used in your code (use alphabetical order!).

**Scripts**:
```bash
# Scan JSX files and add missing keys to en.json (auto-sorts)
yarn translations:update-en

# Sort a translation file alphabetically
yarn translations:sort packages/web-app/public/lang/fr.json

# Check synchronization of a translation file with en.json
yarn translations:sync-with-en packages/web-app/public/lang/es.json
```

#### Using in Components

```javascript
import { FormattedMessage, useIntl } from 'react-intl';

const MyComponent = () => {
  const { formatMessage } = useIntl();

  return (
    <div>
      {/* Simple message */}
      <FormattedMessage id="Welcome to GrottoCenter" />

      {/* Message in placeholder */}
      <input
        placeholder={formatMessage({ id: 'Search caves...' })}
      />

      {/* Message with variables */}
      <FormattedMessage
        id="Found {count} caves"
        values={{ count: 42 }}
      />
    </div>
  );
};
```

#### Placeholders

Transifex allows placeholders in expressions. This helps make expressions dynamic.

Example: "The distance between Paris and Tokyo is 9710 km."

To make this expression translatable and dynamic, use:

```json
{
  "distance.between.cities": "The distance between {city1} and {city2} is {distance} km."
}
```

```javascript
const MyComponent = () => (
  <p>
    {formatMessage(
      {
        id: 'distance.between.cities',
        defaultMessage: 'The distance between {city1} and {city2} is {distance} km.'
      },
      {
        city1: 'Paris',
        city2: 'Tokyo',
        distance: 9710
      }
    )}
  </p>
);
```

### Transifex Integration

- **Transifex** is linked to GitHub and pushes new translation files to the repo automatically when a language has **100% of the strings translated**.
- The file will be automatically pulled by Transifex when your Pull Request is merged into `develop`.

Configuration (`.transifexrc`):
```yaml
filters:
  - filter_type: file
    file_format: KEYVALUEJSON
    source_language: en
    source_file: packages/web-app/src/lang/en.json
    translation_files_expression: packages/web-app/src/lang/<lang>.json
```

### For Translators

1. Create a Transifex account
2. Ask a Wikicaves administrator to add you to GrottoCenter's Transifex
3. Follow [this link](https://www.transifex.com/grottocenter/) to translate the "V3_localisation" resource
4. Choose your translation language
5. Filter expressions (e.g., "not translated" ones)
6. Click on an expression and enter its translation

**Note**: Translations are pulled by developers and put online from time to time. Be patient 😉

---

## 🧪 Testing

### E2E Testing with Cypress

**Running tests**:
```bash
# Start the app first
yarn start

# In another terminal - Interactive mode
yarn e2e:open

# Headless mode
yarn e2e:run
```

**Test structure**:
```javascript
// cypress/e2e/browse-all-pages.cy.js
describe('Browse all pages', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should navigate to cave page', () => {
    cy.get('[data-testid="cave-link"]').click();
    cy.url().should('include', '/caves');
    cy.get('h1').should('contain', 'Caves');
  });
});
```

**Cypress best practices**:
- Use `data-testid` for selectors
- Avoid fragile CSS selectors
- Use `cy.intercept()` to mock APIs
- Isolated and independent tests

### Unit Testing (React Testing Library)

```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import ActionButton from './ActionButton';

describe('ActionButton', () => {
  it('should call onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<ActionButton label="Click me" onClick={handleClick} />);

    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Storybook

**Running Storybook**:
```bash
yarn storybook
```

**Creating a story**:
```javascript
// ActionButton.stories.js
import ActionButton from './ActionButton';

export default {
  title: 'Common/ActionButton',
  component: ActionButton
};

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

## 🔀 Git Workflow

### Branches

- **`develop`**: Main integration branch (base for PRs)
- **`feat/<feature-name>`**: New features
- **`fix/<bug-name>`**: Bug fixes
- **`tech/<technical-task>`**: Technical tasks (refactoring, etc.)

### Commit Convention (CommitLint)


**Required format**: `<type>(<scope>): <description>`

**Allowed types**:
- `feat`: New feature
- `fix`: Bug fix
- `tech`: Technical task
- `refactor`: Refactoring without functional change
- `improvement`: Improvement of an existing feature
- `chore`: Maintenance tasks (dependencies, config)
- `docs`: Documentation
- `style`: Formatting, style (no code change)
- `test`: Adding/modifying tests
- `revert`: Reverting a previous commit

**Rules**:
- **Scope is required** (never empty)
- **Scope in `camelCase` or `PascalCase`**
- Description in lowercase, no trailing period

**Valid examples**:
```bash
feat(Cave): add filter by depth
fix(Map): correct polygon bounds calculation
tech(Redux): migrate to Redux Toolkit
docs(README): update installation instructions
style(Components): apply prettier formatting
```

**Invalid examples**:
```bash
feat: add cave filter           # ❌ Scope missing
feat(cave): add filter          # ❌ Scope must be PascalCase/camelCase
feat(Cave): Add filter.         # ❌ Capital letter and trailing period
```

### Git Hooks (Husky)

**Pre-commit**: Automatic linting of staged files
```bash
# Configured in package.json
"lint-staged": {
  "*.{js, jsx, ts, tsx}": [
    "eslint --cache --fix"
  ]
}
```

**Commit-msg**: Commit message format validation
- Checks conformity with CommitLint

### Contribution Workflow

1. **Create a branch** from `develop`
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feat/my-feature
   ```

2. **Develop and commit** (hooks run automatically)
   ```bash
   git add src/components/MyComponent.jsx
   git commit -m "feat(MyComponent): add new feature"
   ```

3. **Push and create a PR**
   ```bash
   git push origin feat/my-feature
   # Create a PR to develop on GitHub
   ```

4. **CI/CD checks**:
   - Linting (ESLint)
   - E2E tests (Cypress on Firefox & Chrome)
   - App build
   - Azure deployment (if merged to develop)

### Using Issue and Pull Request Templates

**Use issues and pull requests templates** provided by the project.

---

## 🚀 Production Deployment (Azure)

### Overview

The GrottoCenter front web application (under `packages/web-app`) is deployed on **Microsoft Azure Static Web Apps**.

Azure Static Web Apps serves the static files generated by the `yarn build` task, which are located under `packages/web-app/build`.

### Automated Deployment

On every push to the **`develop`** branch, the GitHub Actions workflow to deploy the latest code will run automatically.

**Note**: Later we should switch to the `master` branch instead of the `develop` branch to deploy less often and a more stable code.

### Staging Deployment

A GitHub action will also automatically deploy **up to 3 Pull Requests** of the GrottoCenter front on Azure Static Web Apps for testing.

### Check Static App Locally

You can test the static app generated by `yarn build` before deploying it to Azure locally:

```bash
npm install -g serve
cd packages/web-app
serve -s build
```

### Static Web App Creation

Using the following `az` command line (needs to be run only 1 time):

```bash
az staticwebapp create \
  -n grottocenter-front \
  -g Grottocenter \
  -s https://github.com/GrottoCenter/grottocenter-front \
  -l WestEurope \
  -b develop \
  --app-location . \
  --api-location /api \
  --output-location packages/web-app/build \
  --token GITHUB_TOKEN_WITH_WORKFLOW_ACCESS \
  --debug
```

### Setup

Deployment process inspired by <https://docs.microsoft.com/en-us/azure/static-web-apps/get-started-cli?tabs=react>

1. Install Azure CLI → <https://docs.microsoft.com/en-us/cli/azure/install-azure-cli>

### ⚠️ DANGER ZONE

You can delete the static web app with:

```bash
az staticwebapp delete \
  --name grottocenter-front \
  --resource-group Grottocenter
```

---

## 📦 NPM Scripts

```bash
# Development
yarn start                          # Start app in dev mode (port 3000)
yarn build                          # Production build

# Linting & Formatting
yarn lint                           # Check code (ESLint)
yarn lint:fix                       # Auto-fix errors

# Testing
yarn e2e:open                       # Open Cypress in interactive mode
yarn e2e:run                        # Run Cypress in headless mode

# Documentation
yarn storybook                      # Start Storybook (port 6006)

# Translations
yarn translations:update-en         # Scan code and update en.json
yarn translations:sort <file>       # Sort a translation file
yarn translations:sync-with-en <file>  # Check sync with en.json

# Maintenance
yarn outdated                       # Check outdated dependencies
```

---

## 🌐 Environment Configuration

### Environment Variables

File: `packages/web-app/.env`

```bash
# Backend API
REACT_APP_API_URL=https://api.grottocenter.org

# OAI API (Open Archives Initiative)
REACT_APP_OAI_URL=https://oai.grottocenter.org

# Z39.50 Service (bibliographic protocol)
REACT_APP_Z3950_URL=https://z3950.grottocenter.org
```

**For local development with local API**:
```bash
# In packages/web-app/.env
REACT_APP_API_URL=http://localhost:3001
```

### Prerequisites

- **Node.js**: ≥ 18 (recommended: 20)
- **Yarn**: 4.5.0 (exactly - defined in `packageManager`)
- **OS**: Windows, macOS, Linux

**Installation**:
```bash
# Install dependencies
yarn

# Start the app
yarn start
```

---

## 💡 Development Tips

### General Tips

1. **Code with your browser console opened** and fix the React warnings/errors.
2. **Add your new translation strings to `en.json`** (see Translation Workflow).
3. **Be precise about your component's PropTypes.**
4. **Don't use `// eslint-disable` comment** without an excellent reason to do so. Moreover, the reason must be explicitly written in a comment before the rule disabling. **ESLint is your friend, not your enemy: don't ignore its warnings** 😉
5. **Use issues and pull requests templates.**

### Mapping (Leaflet)


```javascript
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

const CaveMap = ({ caves }) => {
  return (
    <MapContainer center={[45.5, 6.5]} zoom={10}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      {caves.map(cave => (
        <Marker key={cave.id} position={[cave.lat, cave.lng]}>
          <Popup>{cave.name}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};
```

**⚠️ Important points**:
- Always define a CSS height for the map
- Clean up event listeners in `useEffect`
- Use `useMemo` for marker collections

### Form Management (React Hook Form)

```javascript
import { useForm } from 'react-hook-form';

const CaveForm = ({ onSubmit }) => {
  const { register, handleSubmit, formState: { errors } } = useForm();

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        {...register('name', { required: 'Name is required' })}
      />
      {errors.name && <span>{errors.name.message}</span>}

      <button type="submit">Save</button>
    </form>
  );
};
```

### Material-UI Theming

```javascript
import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2'
    },
    secondary: {
      main: '#dc004e'
    }
  }
});

const App = () => (
  <ThemeProvider theme={theme}>
    {/* Components */}
  </ThemeProvider>
);
```

### Error Handling

```javascript
import { ErrorBoundary } from 'react-error-boundary';

const ErrorFallback = ({ error, resetErrorBoundary }) => (
  <div role="alert">
    <h2>Something went wrong</h2>
    <pre>{error.message}</pre>
    <button onClick={resetErrorBoundary}>Try again</button>
  </div>
);

const App = () => (
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <MyApp />
  </ErrorBoundary>
);
```

---

## 🎨 UI/UX Best Practices

### Accessibility (a11y)

- **Labels**: Always associate labels with inputs
  ```javascript
  <label htmlFor="cave-name">Cave Name</label>
  <input id="cave-name" {...register('name')} />
  ```

- **ARIA attributes**: Use for complex interactions
  ```javascript
  <button aria-label="Close dialog" onClick={onClose}>×</button>
  ```

- **Focus management**: Manage focus for modals/dialogs
  ```javascript
  const dialogRef = useRef();
  useEffect(() => {
    if (open) dialogRef.current?.focus();
  }, [open]);
  ```

### Responsive Design

- Use Material-UI breakpoints
  ```javascript
  import { useTheme, useMediaQuery } from '@mui/material';

  const MyComponent = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    return isMobile ? <MobileView /> : <DesktopView />;
  };
  ```

### Performance

- **React.memo**: Memoize expensive components
  ```javascript
  const ExpensiveComponent = React.memo(({ data }) => {
    // Complex rendering
  });
  ```

- **useMemo & useCallback**: Memoize calculations and functions
  ```javascript
  const sortedCaves = useMemo(() =>
    caves.sort((a, b) => a.depth - b.depth),
    [caves]
  );

  const handleClick = useCallback(() => {
    dispatch(fetchCave(id));
  }, [dispatch, id]);
  ```

- **Lazy loading**: Load components on demand
  ```javascript
  const CaveMap = React.lazy(() => import('./components/CaveMap'));

  <Suspense fallback={<Loading />}>
    <CaveMap />
  </Suspense>
  ```

---

## 🚀 Modern JavaScript Best Practices

### ES6+ Syntax

**Optional Chaining & Nullish Coalescing**:
```javascript
// ✅ GOOD
const depth = cave?.measurements?.depth ?? 0;
const name = user?.profile?.name ?? 'Unknown';

// ❌ AVOID
const depth = cave && cave.measurements && cave.measurements.depth || 0;
```

**Array Methods**:
```javascript
// Transformation
const depths = caves.map(cave => cave.depth);

// Filtering
const deepCaves = caves.filter(cave => cave.depth > 100);

// Search
const cave = caves.find(c => c.id === targetId);

// Reduction
const totalDepth = caves.reduce((sum, cave) => sum + cave.depth, 0);

// Existence
const hasDeepCave = caves.some(cave => cave.depth > 500);
```

**Async/Await**:
```javascript
// ✅ GOOD - Clear error handling
const fetchCave = async id => {
  try {
    const response = await fetch(`/api/caves/${id}`);
    if (!response.ok) throw new Error('Fetch failed');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch cave:', error);
    throw error;
  }
};

// ❌ BAD - Complex promise chains
fetch(`/api/caves/${id}`)
  .then(r => r.json())
  .then(data => /* ... */)
  .catch(err => /* ... */);
```

### Functional Programming (with Ramda)

```javascript
import * as R from 'ramda';

// Function composition
const getDeepCaveNames = R.pipe(
  R.filter(R.propSatisfies(R.gt(R.__, 100), 'depth')),
  R.map(R.prop('name')),
  R.sort(R.ascend(R.identity))
);

// Immutability
const updatedCave = R.assoc('visited', true, cave);
const withoutId = R.dissoc('id', cave);

// Lenses (for nested structures)
const depthLens = R.lensPath(['measurements', 'depth']);
const newCave = R.set(depthLens, 250, cave);
```

---

## 🤖 Guide for AI Agents

### Task Analysis

Before starting a task, identify:

1. **Task type**:
   - New feature → `feat(<scope>): ...`
   - Bug fix → `fix(<scope>): ...`
   - Refactoring → `refactor(<scope>): ...`
   - Tech task → `tech(<scope>): ...`

2. **Impacted scope** (for commit):
   - Specific component: `feat(CaveForm): ...`
   - Global feature: `feat(Cave): ...`
   - Infrastructure: `tech(Redux): ...`

3. **Files to modify**:
   - Locate with monorepo structure
   - Check dependencies (actions ↔ reducers ↔ components)

### Development Checklist

Before submitting a change:

- [ ] **ESLint passes** (`yarn lint`)
- [ ] **Code formatted** with Prettier (auto via pre-commit)
- [ ] **PropTypes defined** for new components
- [ ] **i18n keys added** if new UI text
- [ ] **E2E tests updated** if new page/feature
- [ ] **Storybook story created** if new reusable component
- [ ] **Redux state immutable** (no mutations)
- [ ] **Naming conventions** respected (PascalCase, camelCase)
- [ ] **Commit message** conforms to CommitLint
- [ ] **Browser console checked** for warnings/errors

### Patterns to Avoid

❌ **Direct mutations**:
```javascript
state.caves.push(newCave);  // NO
```

❌ **Missing PropTypes**:
```javascript
const Component = ({ data }) => { ... };
// Missing: Component.propTypes = { ... }
```

❌ **Hardcoded text** (no i18n):
```javascript
<Button>Save</Button>  // NO
<FormattedMessage id="Save" />  // YES
```

❌ **console.log in prod**:
```javascript
console.log('debug');  // NO (ESLint warning)
console.error('error');  // OK (allowed)
```

❌ **Fragile CSS selectors** (in Cypress):
```javascript
cy.get('.MuiButton-root').click();  // NO
cy.get('[data-testid="save-btn"]').click();  // YES
```

❌ **Using deprecated patterns**:
```javascript
// NO - deprecated HOC containers
import { connect } from 'react-redux';
export default connect(mapStateToProps)(Component);

// YES - use hooks
import { useSelector, useDispatch } from 'react-redux';
const Component = () => {
  const data = useSelector(state => state.data);
  // ...
};
```

❌ **Using deprecated folders**:
```javascript
// NO - don't add to containers/ or helpers/
import helper from '../../helpers/myHelper';

// YES - use hooks instead
import useMyHook from '../../hooks/useMyHook';
```

### Useful Resources

- **ESLint Airbnb**: <https://github.com/airbnb/javascript>
- **React Hooks**: <https://react.dev/reference/react>
- **Redux Best Practices**: <https://redux.js.org/style-guide>
- **Material-UI Docs**: <https://mui.com/>
- **Cypress Docs**: <https://docs.cypress.io/>
- **React-Intl**: <https://formatjs.io/docs/react-intl/>
- **React DevTools**: <https://react.dev/learn/react-developer-tools>
- **Transifex**: <https://www.transifex.com/grottocenter/>

---

## 📚 Project References

- **Repository**: <https://github.com/GrottoCenter/grottocenter-front>
- **Wiki**: <https://github.com/GrottoCenter/grottocenter-front/wiki>
- **Backend API**: <https://github.com/GrottoCenter/grottocenter-api>
- **Production Site**: <https://fr.wikicaves.org/>
- **Status Monitoring**: <https://uptime.betterstack.com>

---

## 🔄 Document Maintenance

This file should be updated when:

- New technologies are added to the stack
- Code conventions change
- New patterns are established
- Project structure evolves

### Markdown Formatting Rules for This Document

When editing this AGENTS.md file, follow these Markdown rules:

**URLs**:

- Always wrap bare URLs in angle brackets: `<https://example.com>` not `https://example.com`
- Avoids MD034/no-bare-urls warning

**Tables**:

- Use proper spacing in table separators: `| --- | --- |` not `|---|---|`
- Example:

  ```markdown
  | Technology | Version | Usage |
  | ---------- | ------- | ----- |
  | React      | 19.2.0  | UI    |
  ```

**Lists**:

- Surround lists with blank lines (MD032)
- Always add a blank line before and after a list

**Headings**:

- Don't use bold text as headings (MD036)
- Use proper heading levels: `###`, `####`, `#####`
- Avoid duplicate heading names (MD024)

**Spacing**:

- No multiple consecutive blank lines (MD012)
- Maximum one blank line between sections

**Last revision**: 2026-02-13
**Contributors**: AI Agent Claude (Sonnet 4.5)

---

*This document is maintained to facilitate the work of AI agents and new contributors. For any questions or corrections, create an issue on GitHub.*
