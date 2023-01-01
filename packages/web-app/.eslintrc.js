module.exports = {
  env: {
    browser: true
  },
  extends: '../eslint-config/.eslintrc.js',
  overrides: [
    {
      files: ['./src/reducers/**/*.js'],
      rules: {
        'default-param-last': 'off'
      }
    }
  ],
  globals: {
    intlBootstrap: true
  }
};
