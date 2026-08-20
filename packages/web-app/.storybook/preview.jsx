import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';

import GCReducer from '../src/reducers/GCReducer';
import grottoTheme from '../src/conf/grottoTheme';
import messages from '../public/lang/en.json';

const store = configureStore({ reducer: GCReducer });

// Its own client, not the app singleton from conf/queryClient: stories run
// against mocked or absent endpoints, and 'always' keeps one rendering even when
// the browser reports itself offline. No retry, so a failing story shows its
// error state at once instead of after the default backoff.
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, networkMode: 'always' } }
});

const onIntlError = err => {
  if (err.code === 'MISSING_TRANSLATION') return;
  throw err;
};

const withProviders = Story => (
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <IntlProvider locale="en" messages={messages} onError={onIntlError}>
        <StyledEngineProvider injectFirst>
          <ThemeProvider theme={grottoTheme}>
            <CssBaseline />
            <MemoryRouter>
              <Story />
            </MemoryRouter>
          </ThemeProvider>
        </StyledEngineProvider>
      </IntlProvider>
    </QueryClientProvider>
  </Provider>
);

/** @type { import('@storybook/react-vite').Preview } */
const preview = {
  decorators: [withProviders],
  parameters: {
    controls: {
      hideNoControlsWarning: true,
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i
      }
    }
  }
};

export default preview;
