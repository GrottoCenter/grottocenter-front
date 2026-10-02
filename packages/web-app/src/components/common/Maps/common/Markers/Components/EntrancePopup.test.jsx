import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';

import EntrancePopup from './EntrancePopup';

const renderPopup = aestheticism =>
  render(
    <MemoryRouter>
      <IntlProvider
        locale="en"
        messages={{
          '{rating} out of 5 stars': '{rating} out of 5 stars',
          'Limited interest': 'Limited interest',
          Interesting: 'Interesting'
        }}>
        <EntrancePopup
          entrance={{ id: 1, name: 'Test entrance', aestheticism }}
        />
      </IntlProvider>
    </MemoryRouter>
  );

it('shows a named rating for a valid interest average', () => {
  renderPopup(4.9);
  expect(screen.getByRole('img', { name: '2.5 out of 5 stars' })).toBeTruthy();
  expect(screen.getByText('Limited interest – Interesting')).toBeTruthy();
});

it('omits the interest row for a non-finite positive average', () => {
  const { container } = renderPopup(Infinity);
  expect(container.querySelectorAll('.map-popup-property')).toHaveLength(1);
  expect(screen.queryByRole('img')).toBeNull();
});
