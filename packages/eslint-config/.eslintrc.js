module.exports = {
  extends: ['airbnb', 'prettier', 'react-app'],
  parserOptions: {
    ecmaVersion: 2020
  },
  rules: {
    'react/no-unstable-nested-components': 'off', // TODO: remove it and fix them

    'brace-style': 'error',
    'object-curly-newline': 'off',
    'func-names': 'off',
    'react/jsx-props-no-spreading': 'off',
    'react/function-component-definition': [
      2,
      { namedComponents: 'arrow-function' }
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
    'jsx-a11y/href-no-hash': ['off'],
    'react/jsx-filename-extension': ['warn', { extensions: ['.js', '.jsx'] }],
    'react/require-default-props': ['off'],
    'comma-dangle': ['error', 'never'],
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
  plugins: ['prettier', 'react', 'react-hooks']
};
