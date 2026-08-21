import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { IntlProvider } from 'react-intl';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PropTypes from 'prop-types';

import GCReducer from '../reducers/GCReducer';

/**
 * A QueryClient suitable for tests: a fresh one per call, so no cache entry ever
 * leaks between test cases, and no retries, so a queryFn rejection surfaces as
 * an error state immediately instead of after the default backoff.
 *
 * networkMode is 'always' rather than the app's 'offlineFirst': jsdom reports
 * navigator.onLine as true, but pinning it removes the dependency on that
 * entirely — a test must never pause on a simulated network state it did not
 * ask for.
 */
export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, networkMode: 'always', gcTime: Infinity },
      mutations: { retry: false, networkMode: 'always' }
    }
  });

/**
 * Renders a component inside the providers the app supplies in production.
 *
 * @param {React.ReactElement} ui - element under test
 * @param {object} [options]
 * @param {object} [options.preloadedState] - initial Redux state
 * @param {object} [options.store] - a store to reuse across renders (overrides preloadedState)
 * @param {QueryClient} [options.queryClient] - a client to inspect from the test
 * @param {object} [options.messages] - react-intl messages
 * @param {string} [options.locale]
 * @returns the RTL result, plus the `store` and `queryClient` actually used
 */
export const renderWithProviders = (
  ui,
  {
    preloadedState,
    store = configureStore({ reducer: GCReducer, preloadedState }),
    queryClient = createTestQueryClient(),
    messages = {},
    locale = 'en',
    ...renderOptions
  } = {}
) => {
  const Wrapper = ({ children }) => (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <IntlProvider locale={locale} messages={messages}>
          {children}
        </IntlProvider>
      </QueryClientProvider>
    </Provider>
  );
  Wrapper.propTypes = { children: PropTypes.node };

  return {
    store,
    queryClient,
    ...render(ui, { wrapper: Wrapper, ...renderOptions })
  };
};

export default renderWithProviders;
