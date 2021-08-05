module.exports = {
  stories: ['../src/**/*.stories.@(jsx|js)', '../src/**/_stories.@(jsx|js)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-knobs',
    '@storybook/addon-actions',
    '@storybook/addon-viewport/register',
    'storybook-addon-intl/register'
  ],
  webpackFinal: async (config) => {
    config.module.rules.push({
      test: /\.(js|jsx)$/,
      loader: require.resolve('babel-loader'),
      options: {
        plugins: ['emotion'],
        presets: [['react-app', { flow: false, typescript: false }]],
      },
    });
    config.resolve.extensions.push('.ts', '.tsx');
    return config;
  },
  babel: async (options) => ({
    ...options,
    plugins: [
      '@babel/plugin-proposal-logical-assignment-operators',
      '@babel/plugin-proposal-nullish-coalescing-operator'
    ]
    // any extra options you want to set
  }),
};
