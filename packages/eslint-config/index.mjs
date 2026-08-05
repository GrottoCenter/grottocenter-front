import path from 'node:path';
import { fileURLToPath } from 'node:url';

import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';
import cypress from 'eslint-plugin-cypress';
import prettier from 'eslint-plugin-prettier';
import storybook from 'eslint-plugin-storybook';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

// eslint-config-airbnb has no flat build and is no longer released, so it is
// converted on the fly. Everything else below is a native flat config.
const compat = new FlatCompat({ baseDirectory: currentDir });

export const files = ['**/*.{js,jsx,mjs,cjs,ts,tsx}'];

export default [
  { files },
  js.configs.recommended,
  // airbnb ships `no-nested-ternary`, `consistent-return`, `react/prop-types`
  // and the a11y set at `error`. AGENTS.md commits to keeping them there:
  // any override in the block below must state why explicitly.
  ...compat.extends(
    'airbnb',
    'airbnb/hooks',
    // Disables react/react-in-jsx-scope: React 17+ automatic JSX runtime
    'plugin:react/jsx-runtime',
    'prettier'
  ),
  ...storybook.configs['flat/recommended'],
  {
    files: ['**/cypress/**/*.{js,jsx}', '**/cypress.config.js'],
    ...cypress.configs.recommended
  },
  {
    files,
    plugins: { prettier },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } }
    },
    settings: {
      // Deliberately the plain `node` resolver: this package is consumed by
      // workspaces that have no tsconfig, so it cannot assume the TypeScript
      // resolver. The trade-off is that `node` ignores `exports` maps and knows
      // nothing about path aliases — any workspace needing either must override
      // `import/resolver` itself, as the root eslint.config.mjs does for
      // packages/web-app (`@/*` alias + `exports`-only dependencies).
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
          moduleDirectory: ['node_modules', 'src']
        }
      }
    },
    rules: {
      'brace-style': 'error',
      'object-curly-newline': 'off',
      'comma-dangle': ['error', 'never'],
      'func-names': 'off',
      'no-restricted-syntax': [
        'error',
        'ForInStatement',
        'LabeledStatement',
        'WithStatement'
      ],
      'import/no-named-as-default': 'off',
      // Airbnb also restricts `default`, which makes the standard barrel
      // re-export `export { default } from './X'` an error.
      'no-restricted-exports': ['error', { restrictedNamedExports: ['then'] }],
      'import/no-extraneous-dependencies': [
        'error',
        {
          devDependencies: [
            '**/*.test.{js,jsx}',
            '**/*.spec.{js,jsx}',
            '**/setupTests.js',
            '**/__mocks__/**',
            '**/vite.config.{js,mjs}',
            '**/cypress.config.js',
            '**/cypress/**',
            '**/scripts/**',
            '**/.storybook/**',
            '**/_stories.{js,jsx}',
            '**/*.stories.{js,jsx}'
          ]
        }
      ],
      'no-console': [
        'warn',
        {
          allow: ['warn', 'error']
        }
      ],
      // A leading underscore marks a binding as deliberately unused — mostly
      // positional arguments kept for their place in a callback signature.
      'no-unused-vars': [
        'error',
        {
          args: 'after-used',
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          // ESLint 9 reports unused catch bindings by default.
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true
        }
      ],
      // Modules exporting a single named symbol are the convention here
      // (actions, cypress mocks, utils): a default export would say less.
      'import/prefer-default-export': 'off',
      // Airbnb bans `continue` and `++` outright. Both read fine in the loops
      // this codebase actually has, and rewriting them gains nothing.
      'no-continue': 'off',
      'no-plusplus': 'off',
      'no-underscore-dangle': [
        'error',
        {
          allow: [
            // GrottoCenter API wire format
            '_type',
            '_count',
            // Leaflet / leaflet-rotate internals we have to reach into
            '_leaflet_id',
            '_map',
            '_bearing',
            '_setPos',
            '_measureDblclick',
            // LatLngBounds internals (getBounds() result)
            '_southWest',
            '_northEast',
            // Redux DevTools browser extension hook
            '__REDUX_DEVTOOLS_EXTENSION_COMPOSE__',
            // Deliberate internal markers and test seams
            '__resolveWith',
            '__isCreateNew',
            '_origIdx',
            '_resetForTests'
          ]
        }
      ],

      // Airbnb maps the bare name `Link` to an anchor. Here `Link` is MUI's,
      // which is polymorphic — `component="button"` renders a real button.
      // The project's actual anchor component is AppLink.
      'jsx-a11y/anchor-is-valid': [
        'error',
        {
          components: ['AppLink'],
          specialLink: ['to'],
          aspects: ['noHref', 'invalidHref', 'preferButton']
        }
      ],

      'react/require-default-props': 'off',
      // MUI exposes `inputProps` (native input attributes) and `InputProps`
      // (Input component props) side by side: they are two distinct props.
      'react/jsx-no-duplicate-props': ['error', { ignoreCase: false }],
      // `warn`, not `off`, so the remaining instances stay visible in the lint
      // output and can be picked off progressively. See AGENTS.md.
      'react/no-unstable-nested-components': 'warn', // TODO: remove it and fix them
      'react/jsx-filename-extension': ['warn', { extensions: ['.js', '.jsx'] }], // TODO: Rename .js file
      'react/jsx-props-no-spreading': 'off', // TODO: Remove spreaded props
      'react/function-component-definition': [
        2,
        { namedComponents: 'arrow-function' }
      ],
      'prettier/prettier': 'error'
    }
  },
  {
    files: ['**/*.test.{js,jsx}', '**/*.spec.{js,jsx}', '**/__mocks__/**'],
    rules: {
      // `vi.mock` factories are hoisted above the imports, so they can only
      // reach a module through `require()` inside the factory body.
      'global-require': 'off',
      // Test doubles are shaped by the test that renders them; runtime prop
      // validation on a stub adds noise, not safety.
      'react/prop-types': 'off'
    }
  }
];
