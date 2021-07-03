// import { StylesProvider } from '@material-ui/core/styles';
// import { ThemeProvider as MUIThemeProvider } from '@material-ui/core';

import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { withKnobs } from '@storybook/addon-knobs';

export const parameters = {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: { hideNoControlsWarning: true }
};

export const decorators = [
    Story => (
        // <StylesProvider injectFirst>
        //     <MUIThemeProvider>
                <Story />
            // </MUIThemeProvider>
        // </StylesProvider>
    ),
    Story => (
        <BrowserRouter>
            <Story />
        </BrowserRouter>
    ),
    withKnobs
];
