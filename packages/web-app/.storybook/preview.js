import React from 'react';
import { addDecorator } from '@storybook/react';
import StoryRouter from 'storybook-react-router';
import { Provider } from 'react-redux';
import {createStore} from 'redux';
import { setIntlConfig, withIntl } from 'storybook-addon-intl';
import translations from './en.json';
import StylesDecorator from './styles-decorator';

import GCReducer from "../src/reducers/GCReducer";

const store = createStore(GCReducer);


export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: { hideNoControlsWarning: true }
};

const ReduxProviderWrapper = ({ children, store }) => (
    <Provider store={store}>
      {children}
    </Provider>
);

export const withReduxProvider = (story) => (
    <ReduxProviderWrapper store={store}>
      {story()}
    </ReduxProviderWrapper>
)

const getMessages = (__) => translations;

// Set intl configuration
setIntlConfig({
  locales: translations,
  defaultLocale: 'en',
  getMessages,
});

addDecorator(withIntl);
addDecorator(StylesDecorator);
addDecorator(StoryRouter());
addDecorator(withReduxProvider)
