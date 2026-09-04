import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';

import GuidelinesGrouped from './GuidelinesGrouped';

vi.mock('@/hooks', () => ({
  useAnchorScroll: () => {},
  useOnlineStatus: () => true
}));

const messages = {
  Guidelines: 'Guidelines',
  'Copy link': 'Copy link',
  'Country guideline': 'Country guideline',
  'Region guideline': 'Region guideline',
  'Massif guideline': 'Massif guideline'
};

const guideline = {
  id: 42,
  title: 'Access restrictions',
  description: 'Keep the gate closed.',
  isDeleted: false
};

const renderGroupedGuidelines = guidelines =>
  render(
    <MemoryRouter>
      <IntlProvider locale="en" messages={messages}>
        <GuidelinesGrouped guidelines={guidelines} />
      </IntlProvider>
    </MemoryRouter>
  );

it('shows each inherited scope as a chip without group headings', () => {
  renderGroupedGuidelines({
    country: [guideline],
    region: [],
    massif: [{ ...guideline }]
  });

  expect(
    screen.getByRole('link', { name: 'Access restrictions' })
  ).toBeVisible();
  expect(
    screen.getAllByRole('link', { name: 'Access restrictions' })
  ).toHaveLength(1);
  expect(screen.getByText('Country guideline')).toBeVisible();
  expect(screen.getByText('Massif guideline')).toBeVisible();
  expect(
    screen.queryByRole('heading', { name: 'Country guideline' })
  ).toBeNull();
});
