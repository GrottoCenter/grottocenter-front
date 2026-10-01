import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';

import InterestStars from './index';

it('names the half-star rating in the popup locale', () => {
  render(
    <IntlProvider
      locale="en"
      messages={{ '{rating} out of 5 stars': '{rating} out of 5 stars' }}>
      <InterestStars value={4.9} />
    </IntlProvider>
  );

  expect(screen.getByRole('img', { name: '2.5 out of 5 stars' })).toBeTruthy();
});
