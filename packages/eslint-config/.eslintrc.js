module.exports = {
  extends: [
    'eslint:recommended',
    'airbnb',
    'airbnb/hooks',
    // Disables react/react-in-jsx-scope: React 17+ automatic JSX runtime
    'plugin:react/jsx-runtime',
    'prettier',
    'plugin:cypress/recommended',
    'plugin:storybook/recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest'
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
        ignoreRestSiblings: true
      }
    ],
    'react/require-default-props': 'off',
    // MUI exposes `inputProps` (native input attributes) and `InputProps`
    // (Input component props) side by side: they are two distinct props.
    'react/jsx-no-duplicate-props': ['error', { ignoreCase: false }],
    'react/no-unstable-nested-components': 'off', // TODO: remove it and fix them
    'react/jsx-filename-extension': ['warn', { extensions: ['.js', '.jsx'] }], // TODO: Rename .js file
    'react/jsx-props-no-spreading': 'off', // TODO: Remove spreaded props
    'react/function-component-definition': [
      2,
      { namedComponents: 'arrow-function' }
    ],
    'prettier/prettier': 'error'
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
        moduleDirectory: ['node_modules', 'src']
      }
    }
  },
  plugins: ['prettier']
};
