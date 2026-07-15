module.exports = {
  env: {
    browser: true
  },
  extends: ['react-app'],
  overrides: [
    {
      files: ['./src/reducers/**/*.js'],
      rules: {
        'default-param-last': 'off'
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
