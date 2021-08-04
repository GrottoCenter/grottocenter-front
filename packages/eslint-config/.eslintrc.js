module.exports = {
  extends: ['react-app', 'airbnb', 'prettier', 'prettier/react'],
  rules: {
    'brace-style': 'error',
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
  plugins: ['prettier']
};
