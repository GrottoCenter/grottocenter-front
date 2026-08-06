import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { Button } from '@mui/material';
import grottoTheme from '../../../conf/grottoTheme';
import CustomIcon from './index';

// jsdom's getComputedStyle does not resolve descendant combinators, so asserting
// on the element would report `none` whether or not the rule exists. Read the
// stylesheet Emotion actually emitted instead — that is the thing under test:
// `.Mui-disabled &` has to compile to a rule scoped to a disabled ancestor.
const emittedCss = () =>
  Array.from(document.querySelectorAll('style'))
    .map(styleEl =>
      styleEl.textContent?.length
        ? styleEl.textContent
        : Array.from(styleEl.sheet?.cssRules ?? [])
            .map(rule => rule.cssText)
            .join('\n')
    )
    .join('\n');

const renderInButton = ({ disabled }) =>
  render(
    <ThemeProvider theme={grottoTheme}>
      <Button disabled={disabled} startIcon={<CustomIcon type="entrance" />}>
        Add
      </Button>
    </ThemeProvider>
  );

describe('CustomIcon', () => {
  it('renders the icon as an <img>', () => {
    renderInButton({ disabled: false });
    expect(screen.getByRole('img', { name: 'Entrance' })).toBeInTheDocument();
  });

  // These icons are standalone SVG files loaded through <img>, so they ignore
  // `currentColor` and MUI's disabled text colour never reaches them: without
  // this rule the label greys out while the icon stays fully saturated.
  it('carries a disabled-scoped rule that desaturates it', () => {
    renderInButton({ disabled: true });

    const wrapperClasses = screen
      .getByRole('img', { name: 'Entrance' })
      .parentElement.className.split(/\s+/)
      .filter(Boolean);

    const rule = emittedCss()
      .split('\n')
      .find(
        line =>
          line.startsWith('.Mui-disabled ') &&
          wrapperClasses.some(cls => line.includes(`.${cls}{`))
      );

    expect(rule).toBeDefined();
    expect(rule).toContain('filter:grayscale(100%)');
    expect(rule).toContain(
      `opacity:${grottoTheme.palette.action.disabledOpacity}`
    );
  });
});
