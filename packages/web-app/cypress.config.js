const { defineConfig } = require('cypress');
const path = require('node:path');

module.exports = defineConfig({
  allowCypressEnv: false,
  e2e: {
    baseUrl: 'http://localhost:3000/ui',
    setupNodeEvents(on) {
      on('before:browser:launch', (browser, launchOptions) => {
        if (process.env.CI && browser.name === 'chrome') {
          // Preserve network failures that React's error boundary catches.
          launchOptions.args.push(
            `--log-net-log=${path.join(__dirname, 'cypress/chrome-netlog.json')}`
          );
        }
        return launchOptions;
      });
    }
  }
});
