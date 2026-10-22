const { defineConfig } = require('cypress');
const fs = require('node:fs');
const path = require('node:path');

module.exports = defineConfig({
  allowCypressEnv: false,
  e2e: {
    baseUrl: 'http://localhost:3000/ui',
    setupNodeEvents(on) {
      on('before:browser:launch', (browser, launchOptions) => {
        if (!process.env.CI || browser.name !== 'chrome') return launchOptions;
        const portArgument = launchOptions.args.find(argument =>
          argument.startsWith('--remote-debugging-port=')
        );
        const port = portArgument?.split('=')[1];
        if (!port) throw new Error('Missing Chrome debugging port');
        const attached = new Set();
        const logPath = path.join(
          __dirname,
          'cypress/chrome-network-errors.log'
        );
        const writeError = error =>
          fs.appendFileSync(logPath, `${JSON.stringify(error)}\n`);
        // Observe native resource errors, which console.error cannot capture.
        const timer = setInterval(async () => {
          try {
            const targets = await fetch(
              `http://127.0.0.1:${port}/json/list`
            ).then(response => response.json());
            targets
              .filter(target => target.type === 'page')
              .forEach(target => {
                if (attached.has(target.id)) return;
                attached.add(target.id);
                const socket = new WebSocket(target.webSocketDebuggerUrl);
                const requests = new Map();
                socket.addEventListener('open', () => {
                  writeError({ event: 'attached', target: target.type });
                  socket.send(JSON.stringify({ id: 1, method: 'Log.enable' }));
                  socket.send(
                    JSON.stringify({ id: 2, method: 'Network.enable' })
                  );
                });
                socket.addEventListener('message', event => {
                  const message = JSON.parse(event.data);
                  const { method, params } = message;
                  if (method === 'Network.requestWillBeSent') {
                    requests.set(params.requestId, params.request.url);
                  }
                  if (method === 'Network.loadingFailed') {
                    const url = requests.get(params.requestId);
                    if (url?.includes('/assets/'))
                      writeError({ url, ...params });
                    requests.delete(params.requestId);
                  }
                  if (method === 'Network.loadingFinished') {
                    requests.delete(params.requestId);
                  }
                  if (
                    method === 'Log.entryAdded' &&
                    params.entry.url?.includes('/assets/')
                  ) {
                    writeError(params.entry);
                  }
                });
                socket.addEventListener('close', () =>
                  attached.delete(target.id)
                );
                socket.addEventListener('error', () =>
                  attached.delete(target.id)
                );
              });
          } catch {
            // The debugging server starts after the browser launch callback.
          }
        }, 500);
        timer.unref();
        return launchOptions;
      });
    }
  }
});
