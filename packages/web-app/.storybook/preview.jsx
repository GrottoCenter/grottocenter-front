import { Provider } from 'react-redux';
import { createStore } from 'redux';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';

import GCReducer from '../src/reducers/GCReducer';
import grottoTheme from '../src/conf/grottoTheme';
import messages from '../public/lang/en.json';

const store = createStore(GCReducer);

const onIntlError = err => {
  if (err.code === 'MISSING_TRANSLATION') return;
  throw err;
};

const withProviders = Story => (
  <Provider store={store}>
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
