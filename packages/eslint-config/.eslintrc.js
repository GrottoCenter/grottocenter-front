module.exports = {
  extends: [
    'eslint:recommended',
    'airbnb',
    'airbnb/hooks',
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
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: ['.storybook/**', 'stories/**', '**/*stories.js']
      }
    ],
    'no-console': [
      'warn',
      {
        allow: ['warn', 'error']
      }
    ],
    'react/require-default-props': 'off',
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
