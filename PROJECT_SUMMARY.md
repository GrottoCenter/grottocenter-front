# GrottoCenter Frontend - LLM-Friendly Project Summary

## Overview
GrottoCenter is a web application frontend for the speleology (cave exploration) community. It's a React-based application that provides a comprehensive platform for managing cave data, documents, organizations, and user contributions. The project uses a modern tech stack with Material-UI components, Redux for state management, and supports multiple languages.

## Architecture & Tech Stack

### Core Technologies
- **React 18.3.1** - Main UI framework
- **Material-UI (MUI) 5.16.7** - Component library and theming
- **Redux 5.0.1** + **Redux Thunk 3.1.0** - State management
- **React Router 6.26.2** - Client-side routing
- **React Intl 6.7.0** - Internationalization
- **Leaflet 1.9.4** + **React Leaflet 4.2.1** - Interactive maps
- **TypeScript 5.6.2** - Type safety (partial adoption)

### Development Tools
- **Yarn 4.5.0** with workspaces - Package management
- **ESLint 8.57.1** + **Prettier 3.3.3** - Code quality
- **Storybook 8.3.5** - Component development
- **Cypress 13.15.0** - E2E testing
- **Husky 9.1.6** - Git hooks

## Project Structure

### Monorepo Organization
```
grottocenter-front/
├── packages/
│   ├── web-app/                 # Main React application
│   ├── eslint-config/           # Shared ESLint configuration
│   ├── eslint-config-typescript/# TypeScript ESLint config
│   ├── prettier-config/         # Shared Prettier configuration
│   └── ts-config/              # Shared TypeScript configuration
├── scripts/                     # Utility scripts for translations
└── .github/workflows/          # CI/CD configuration
```

### Main Application Structure (`packages/web-app/src/`)
```
src/
├── actions/                     # Redux action creators
├── assets/
│   └── icons/                  # SVG icon files (webpack-bundled)
│       └── index.js            # Central re-export — always import icons from here
├── components/                  # Reusable UI components
│   ├── appli/                  # Application-specific components
│   └── common/                 # Generic reusable components
├── conf/                       # Configuration files
├── containers/                 # Redux-connected components
├── helpers/                    # Utility functions
├── hooks/                      # Custom React hooks
├── pages/                      # Route-level page components
├── reducers/                   # Redux reducers
├── types/                      # TypeScript type definitions
└── util/                       # General utilities
```

## Key File Paths & Purposes

### Configuration Files
- `packages/web-app/.env` - Environment variables (API URLs)
- `packages/web-app/src/conf/config.js` - App configuration constants
- `packages/web-app/src/conf/apiRoutes.js` - API endpoint definitions
- `packages/web-app/src/conf/grottoTheme.js` - Material-UI theme customization
- `packages/web-app/src/conf/MapMarkersConfig.js` - Map marker configurations

### Core Application Files
- `packages/web-app/src/App.jsx` - Main app component with routing
- `packages/web-app/src/pages/ApplicationShell.jsx` - Layout wrapper
- `packages/web-app/src/reducers/GCReducer.js` - Root Redux reducer
- `packages/web-app/src/index.js` - Application entry point

### Translation System
- `packages/web-app/public/lang/` - Translation files (15 languages)
- `packages/web-app/public/lang/en.json` - Master English translations
- `scripts/update-translations.js` - Auto-extract translation keys

### Testing & Development
- `packages/web-app/cypress/` - E2E test specifications
- `packages/web-app/.storybook/` - Storybook configuration
- `packages/web-app/src/**/_stories.js` - Component stories

## Dependencies & Their Roles

### UI & Styling
- `@mui/material` (5.16.7) - Core Material-UI components
- `@mui/icons-material` (5.16.7) - Material Design icons
- `@emotion/react` & `@emotion/styled` - CSS-in-JS styling
- `@mui/x-date-pickers` (7.19.0) - Date/time picker components

### State Management & Data Fetching
- `redux` (5.0.1) - Predictable state container
- `redux-thunk` (3.1.0) - Async action creators
- `isomorphic-fetch` (3.0.0) - HTTP requests

### Maps & Geospatial
- `leaflet` (1.9.4) - Interactive map library
- `react-leaflet` (4.2.1) - React bindings for Leaflet
- `leaflet-draw` (1.0.4) - Drawing tools for maps
- `proj4` (2.12.1) - Coordinate system transformations
- `d3` (7.9.0) + `d3-hexbin` (0.2.2) - Data visualization

### Internationalization
- `react-intl` (6.7.0) - React internationalization
- `date-fns` (4.1.0) - Date formatting and manipulation

### Forms & Validation
- `react-hook-form` (7.53.0) - Form state management
- `react-select-country-list` (2.2.3) - Country selection
- `react-phone-input-2` (2.15.1) - Phone number input

### File Handling & CSV
- `react-dropzone-uploader` (2.11.0) - File upload component
- `react-csv` (2.2.2) - CSV export functionality
- `react-papaparse` (4.4.0) - CSV parsing

## Available Tools & APIs

### Translation System
```bash
# Extract translation keys from JSX files
yarn update-translations

# Compare translation files
yarn compare-translations file1.json file2.json

# Sort translation keys alphabetically
node scripts/sort_translations.js path/to/file.json
```

### Development Commands
```bash
# Start development server
yarn start

# Build for production
yarn build

# Run linting
yarn lint
yarn lint:fix

# Run E2E tests
yarn e2e:run    # Headless
yarn e2e:open   # Interactive

# Start Storybook
yarn storybook
```

### API Integration
The app connects to a backend API with endpoints for:
- Authentication (`/login`, `/signup`, `/forgotPassword`)
- Cave management (`/caves`, `/entrances`, `/massifs`)
- Document management (`/documents`)
- User management (`/cavers`)
- Geographic data (`/geoloc`)
- Search functionality (`/search`, `/advanced-search`)

### Custom Hooks
- `useBoolean` - Boolean state management
- `useDebounce` - Debounced values
- `useNotification` - Toast notifications
- `usePermissions` - User permission checks
- `useSubscriptions` - Entity subscriptions

## Translation Structure

### Supported Languages (15)
Arabic, Bulgarian, Catalan, German, Greek, English, Spanish, French, Hebrew, Indonesian, Italian, Japanese, Dutch, Portuguese, Romanian

### Translation Workflow
1. **Key Extraction**: `update-translations.js` scans JSX files for:
   - `<Translate>text</Translate>` components
   - `formatMessage({ id: 'key' })` calls
   - `intl.formatMessage({ id: 'key' })` calls

2. **File Structure**: Each language has a JSON file in `public/lang/`
3. **Fallback**: English (`en.json`) serves as the master translation file
4. **Usage Patterns**:
   ```jsx
   <Translate>Hello World</Translate>
   formatMessage({ id: 'hello.world' })
   ```

## Test Organization

### E2E Testing (Cypress)
- **Location**: `packages/web-app/cypress/e2e/`
- **Configuration**: `cypress.config.js`
- **Base URL**: `http://localhost:3000/ui`
- **Test Pattern**: `browse-all-pages.cy.js` - Navigation testing

### Component Testing (Storybook)
- **Stories Location**: `src/**/_stories.js` or `src/**/*.stories.js`
- **Configuration**: `.storybook/main.js`
- **Addons**: Links, essentials, knobs, actions, viewport
- **Usage**: Component isolation and visual testing

### Unit Testing
- **Framework**: React Testing Library + Jest
- **Setup**: `src/setupTests.js`
- **Pattern**: Co-located test files

## Implementation Patterns & Conventions

### Component Architecture
1. **Functional Components**: All components use React hooks
2. **PropTypes**: Runtime type checking for props
3. **Styled Components**: Material-UI's styling solution
4. **Container Pattern**: Redux-connected containers in `/containers`

### State Management
1. **Redux Structure**: Feature-based reducer organization
2. **Action Creators**: Thunk-based async actions
3. **Naming Convention**: `VERB_ENTITY_STATUS` (e.g., `FETCH_CAVE_SUCCESS`)
4. **CRITICAL**: Always use reducers to manage state changes - dispatch actions and handle them in reducers rather than managing state locally in components

### API Integration
1. **CRITICAL**: Never hardcode API URLs - always use route builders from `conf/apiRoutes.js`

### Routing
1. **React Router v6**: Declarative routing
2. **Route Structure**: `/ui/entity/:id` pattern
3. **Protected Routes**: Authentication checks via `AuthChecker`

### Styling
1. **Material-UI Theme**: Custom brown/orange color scheme
2. **Responsive Design**: Mobile-first approach
3. **CSS-in-JS**: Emotion-based styling

### Code Quality
1. **ESLint**: Airbnb configuration with custom rules
2. **Prettier**: Consistent code formatting
3. **Husky**: Pre-commit hooks for linting
4. **Conventional Commits**: Standardized commit messages

## Development Workflow

### Getting Started
1. Install Node.js 20+ and Yarn 4.5.0
2. Run `yarn` to install dependencies
3. Configure `.env` file for API endpoints
4. Run `yarn start` for development

### Environment Configuration
- **Development**: Local API at `http://127.0.0.1:1337`
- **Production**: `https://api.grottocenter.org`
- **Additional Services**: OAI and Z3950 endpoints

### Git Workflow
1. **Branches**: Feature branches from `develop`
2. **Commits**: Conventional commit format
3. **Hooks**: Automatic linting and testing
4. **CI/CD**: GitHub Actions for deployment

## Extension Points

### Critical Development Rules
1. **API Routes**: ALWAYS use route builders from `conf/apiRoutes.js`
   - ❌ BAD: `fetch('${process.env.REACT_APP_API_URL}/api/v1/caves/${id}')`
   - ✅ GOOD: `fetch(getCaveUrl + id)` or `fetch(putCaveUrl(id))`
   - Add new route builders to `apiRoutes.js` if they don't exist

2. **State Management**: ALWAYS use Redux reducers for state changes
   - ❌ BAD: Managing API response data in component state
   - ✅ GOOD: Dispatch actions, handle in reducers, connect via useSelector
   - Create action types (VERB_ENTITY, VERB_ENTITY_SUCCESS, VERB_ENTITY_FAILURE)
   - Handle all action types in appropriate reducers
   - Use loading/error states from Redux, not local component state

3. **Icons**: ALWAYS import from the central index `src/assets/icons/index.js` ; never import individual SVG files directly
   - ❌ BAD: `import entranceIcon from '../assets/icons/entrance.svg'`
   - ✅ GOOD: `import { entranceIcon } from '../assets/icons'`
   - To add a new icon: add the SVG to `src/assets/icons/`, export it from `index.js`, add it to `CustomIcon`'s `iconSources` map
   - `<CustomIcon type="entrance" size={35} />` for inline entity icons (supported types: `entrance`, `depth`, `length`, `network`, `bibliography`, `organization`, `caver`, `massif`, `altitude`, `coordinates`, `entrance_marker`, `time_to_go`, `underground_time`), can be extended

### Adding New Features
1. **New Pages**: Add to `src/pages/` and update routing in `App.jsx`
2. **New Components**: Follow the `common/` vs `appli/` distinction
3. **New API Endpoints**: ALWAYS add route builders to `conf/apiRoutes.js` - never hardcode URLs
4. **New Actions**: Create action creators in `actions/` and handle them in appropriate reducers
5. **New Translations**: Use `update-translations` script

### Customization Areas
1. **Theme**: Modify `conf/grottoTheme.js` for visual changes
2. **Maps**: Extend `MapMarkersConfig.js` for new marker types — import icons from `src/assets/icons`
3. **Forms**: Create new form components in `components/Form/`
4. **Validation**: Add custom validators in form components

### Integration Points
1. **External APIs**: Configure in environment variables
2. **Authentication**: Extend auth actions and reducers
3. **File Upload**: Customize `AddFileForm` component
4. **Search**: Extend advanced search components

### Performance Optimization
1. **Code Splitting**: Use React.lazy for route-level splitting
2. **Memoization**: Apply React.memo for expensive components
3. **Bundle Analysis**: Use webpack-bundle-analyzer
4. **Image Optimization**: Implement lazy loading for images

## Deployment & Production

### Build Process
- **Command**: `yarn build`
- **Output**: `packages/web-app/build/`
- **Static Assets**: Served from `/images/` and `/static/`

### Azure Static Web Apps
- **Configuration**: `staticwebapp.config.json`
- **Routing**: SPA fallback to `index.html`
- **CI/CD**: Automated deployment via GitHub Actions

This summary provides a comprehensive overview for LLM assistants to understand the project structure, patterns, and extension points without requiring additional context exploration.