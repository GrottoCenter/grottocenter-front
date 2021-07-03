module.exports = {
  extends: ['react-app', 'airbnb', 'prettier'],
  parser: 'babel-eslint',
  rules: {
    'prettier/prettier': ['error'],
    'brace-style': 'error',
    'arrow-parens': 1,
    'object-curly-newline': 'off',
    'func-names': 'off',
    'react/jsx-props-no-spreading': 'off',
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
    'comma-dangle': ['error', 'never']
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
        moduleDirectory: ['src']
      }
    }
  },
  globals: {
    window: true,
    document: true,
    locale: true,
    localesList: true
  },
  plugins: ['prettier']
};
