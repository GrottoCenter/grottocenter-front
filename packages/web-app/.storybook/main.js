/** @type { import('@storybook/react-vite').StorybookConfig } */
const config = {
  stories: ['../src/**/*.stories.@(js|jsx)', '../src/**/_stories.@(js|jsx)'],
  addons: ['@storybook/addon-links'],
  framework: {
    name: '@storybook/react-vite',
    options: {}
  },
  staticDirs: ['../public'],
  core: {
    disableTelemetry: true
  },
  // Storybook inherits the app's Vite config, but its manager and preview
  // must not generate the app's service worker or validate its precache.
  viteFinal: viteConfig => ({
    ...viteConfig,
    plugins: viteConfig.plugins
      .flat(Infinity)
      .filter(
        plugin =>
          !plugin?.name?.startsWith('vite-plugin-pwa') &&
          plugin?.name !== 'service-worker-build-guard'
      )
  })
};

export default config;
