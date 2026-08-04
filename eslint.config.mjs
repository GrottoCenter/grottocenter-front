import globals from 'globals';

import grottoConfig, { files } from '@grotto-front/eslint-config';

// Flat config has no cascade: what used to live in packages/web-app/.eslintrc.js
// and scripts/.eslintrc.js is expressed here as `files`-scoped blocks.
export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/*.d.ts',
      '**/dist/**',
      '**/storybook-static/**',
      '**/coverage/**',
      '**/build/**',
      '**/public/**'
    ]
  },

  ...grottoConfig,

  // --- packages/web-app ----------------------------------------------------
  {
    files: ['packages/web-app/**/*.{js,jsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        intlBootstrap: true
      }
    },
    settings: {
      // Overrides the shared `node` resolver: it reads the `@/*` alias from
      // tsconfig.json (kept in sync with the Vite alias) and, unlike
      // eslint-import-resolver-node, honours `exports` maps — several
      // dependencies (react-to-print, storybook/actions) ship no `main` field.
      'import/resolver': {
        typescript: {
          project: './packages/web-app/tsconfig.json'
        }
      },
      // Vite virtual modules have no on-disk counterpart to resolve.
      'import/core-modules': ['virtual:pwa-register']
    }
  },
  {
    files: ['packages/web-app/src/reducers/**/*.js'],
    rules: {
      // Reducers take (state = initialState, action): the default is first
      // by definition.
      'default-param-last': 'off'
    }
  },
  {
    files: [
      '**/*.test.{js,jsx}',
      '**/*.spec.{js,jsx}',
      '**/setupTests.js',
      '**/__mocks__/**/*.{js,jsx}'
    ],
    languageOptions: {
      globals: {
        ...globals.vitest,
        vi: 'readonly'
      }
    }
  },

  // --- Node-side files: build scripts, tool configs, Storybook setup --------
  // None of these ship to the browser, and they all legitimately reach for
  // devDependencies.
  {
    files: [
      '*.{js,mjs,cjs}',
      'scripts/**/*.js',
      'packages/web-app/scripts/**/*.js',
      '**/*.config.{js,mjs,cjs}',
      '**/.prettierrc.js',
      '**/.storybook/**/*.{js,jsx}'
    ],
    languageOptions: { globals: globals.node },
    settings: {
      // Same reason as the web-app block: the node resolver ignores `exports`
      // maps, and vite ships one with no `main` field.
      'import/resolver': { typescript: {} }
    },
    rules: {
      'no-console': 'off',
      'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
      // The prettier configs re-export a sibling package through require().
      'global-require': 'off',
      'import/extensions': 'off'
    }
  },

  { files }
];
