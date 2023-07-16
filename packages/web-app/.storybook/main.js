module.exports = {
  stories: ['../src/**/*.stories.@(jsx|js)', '../src/**/_stories.@(jsx|js)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-knobs',
    '@storybook/addon-actions',
    '@storybook/addon-viewport'
  ],
  framework: '@storybook/react-webpack5',
  staticDirs: ['../public'],
  docs: { autodocs: true },
  features: {
    storyStoreV7: false
  },
  core: {
    disableTelemetry: true
  }
};
