import React from 'react';
import StoryRouter from 'storybook-react-router';
import { Provider, useSelector } from 'react-redux';
import { createStore } from 'redux';
import { IntlProvider } from 'react-intl';
import StylesDecorator from './styles-decorator';

import GCReducer from '../src/reducers/GCReducer';

const store = createStore(GCReducer);

const ReduxProviderWrapper = ({ children, store }) => (
  <Provider store={store}>{children}</Provider>
);

const customOnIntlError = err => {
  if (err.code === 'MISSING_TRANSLATION') {
    console.log(`MISSING_TRANSLATION FOR ${err.descriptor.id}`); // eslint-disable-line no-console
    return;
  }
  throw err;
};
const HydratedIntlProvider = ({ children }) => {
  const { locale, messages } = useSelector(state => state.intl);
  return (
    <IntlProvider
      locale={locale}
      messages={messages[locale]}
      onError={customOnIntlError}
    >
      {children}
    </IntlProvider>
  );
};

export const withReduxProvider = story => (
  <ReduxProviderWrapper store={store}>
    <HydratedIntlProvider>{story()}</HydratedIntlProvider>
  </ReduxProviderWrapper>
);

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: { hideNoControlsWarning: true }
};

export const decorators = [StylesDecorator, StoryRouter(), withReduxProvider];
