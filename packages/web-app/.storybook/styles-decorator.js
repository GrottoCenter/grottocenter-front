import React from 'react';

import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';
import StylesProvider from '@mui/styles/StylesProvider';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';

import MainTheme from '../src/conf/grottoTheme';

const StylesDecorator = storyFn => (
  <StylesProvider injectFirst>
    <CssBaseline />
    <StyledThemeProvider theme={MainTheme}>
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={MainTheme}>{storyFn()}</ThemeProvider>
      </StyledEngineProvider>
    </StyledThemeProvider>
  </StylesProvider>
);

export default StylesDecorator;
