import React from 'react';
import { addDecorator } from '@storybook/react';
import StoryRouter from 'storybook-react-router';
import { setIntlConfig, withIntl } from 'storybook-addon-intl';
import translations from './en.json';
import StylesDecorator from './styles-decorator';



export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: { hideNoControlsWarning: true }
};



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
