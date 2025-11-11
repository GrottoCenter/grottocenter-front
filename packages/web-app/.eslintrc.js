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
    }
  ],
  globals: {
    intlBootstrap: true
  }
};
