import { useState } from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PropTypes from 'prop-types';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';

import GCReducer from '../src/reducers/GCReducer';
import grottoTheme from '../src/conf/grottoTheme';
import messages from '../public/lang/en.json';

const store = configureStore({ reducer: GCReducer });

const onIntlError = err => {
  if (err.code === 'MISSING_TRANSLATION') return;
  throw err;
};

const StoryProviders = ({ children }) => {
  // Never reuse the app singleton from conf/queryClient here: stories run
  // against mocked or absent endpoints. A client per story also prevents one
  // story's cached response from leaking into the next story's mocks. Keeping
  // it in state preserves the cache across control-driven rerenders.
  const [storyQueryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: false, networkMode: 'always', gcTime: 0 }
        }
      })
  );

  return (
    <Provider store={store}>
      <QueryClientProvider client={storyQueryClient}>
        <IntlProvider locale="en" messages={messages} onError={onIntlError}>
          <StyledEngineProvider injectFirst>
            <ThemeProvider theme={grottoTheme}>
              <CssBaseline />
              <MemoryRouter>{children}</MemoryRouter>
            </ThemeProvider>
          </StyledEngineProvider>
        </IntlProvider>
      </QueryClientProvider>
    </Provider>
  );
};

StoryProviders.propTypes = {
  children: PropTypes.node.isRequired
};

const withProviders = (Story, context) => (
  <StoryProviders key={context.id}>
    <Story />
  </StoryProviders>
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
