import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { IntlProvider } from 'react-intl';

import grottoTheme from '@/conf/grottoTheme';
import RandomEntry from './RandomEntry';

vi.mock('../../containers/RandomEntryCardContainer', () => ({
  default: () => null
}));

it('renders the random cave title in white on the brown section', () => {
  render(
    <ThemeProvider theme={grottoTheme}>
      <IntlProvider
        locale="en"
        messages={{ 'Discover a random cave': 'Discover a random cave' }}>
        <RandomEntry />
      </IntlProvider>
    </ThemeProvider>
  );

  expect(
    screen.getByRole('heading', { name: 'Discover a random cave' })
  ).toHaveStyle({ color: 'rgb(255, 255, 255)' });
});
