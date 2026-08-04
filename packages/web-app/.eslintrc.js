module.exports = {
  env: {
    browser: true
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
  },
  overrides: [
    {
      files: ['./src/reducers/**/*.js'],
      rules: {
        'default-param-last': 'off'
      }
    },
    {
      // Build-time Node scripts, not shipped code: logging is their output.
      files: ['./scripts/**/*.js'],
      env: { node: true },
      rules: {
        'no-console': 'off'
      }
    },
    {
      files: ['./cypress/**/*.js'],
      globals: {
        cy: 'readonly',
        Cypress: 'readonly'
      }
    },
    {
      files: ['**/*.test.{js,jsx}', '**/*.spec.{js,jsx}', '**/setupTests.js'],
      globals: {
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        vi: 'readonly',
        vitest: 'readonly'
      }
    }
  ],
  globals: {
    intlBootstrap: true
  }
};
