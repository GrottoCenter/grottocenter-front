import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import { PointPopup } from './PointPopup';

it('links to the point and displays administrative information and zero coordinates', () => {
  render(
    <MemoryRouter>
      <IntlProvider locale="en" messages={{}}>
        <PointPopup
          point={{
            id: 6,
            label: 'Surface station',
            latitude: 0,
            longitude: 0,
            city: 'Test city',
            region: 'Test region',
            country: 'Test country'
          }}
        />
      </IntlProvider>
    </MemoryRouter>
  );
  expect(screen.getByRole('link', { name: 'Surface station' })).toHaveAttribute(
    'href',
    '/ui/points/6'
  );
  expect(screen.getByText('Test city, Test region, Test country')).toBeTruthy();
  expect(screen.getByText(/0\.0000/)).toBeTruthy();
});
