import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';

import entitiesConfig from './entitiesConfig';

it('expands an overflowing guideline description inline', async () => {
  const user = userEvent.setup();
  vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(80);
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(40);
  const descriptionColumn = entitiesConfig.guidelines.columns.find(
    column => column.field === 'description'
  );

  render(
    <IntlProvider
      locale="en"
      messages={{ 'Show more': 'Show more', 'Show less': 'Show less' }}>
      {descriptionColumn.render(
        'A deliberately long description\nwith an intentional line break.'
      )}
    </IntlProvider>
  );

  const toggle = screen.getByRole('button', { name: 'Show more' });
  expect(toggle).toHaveAttribute('aria-expanded', 'false');

  await user.click(toggle);

  expect(screen.getByRole('button', { name: 'Show less' })).toHaveAttribute(
    'aria-expanded',
    'true'
  );
  expect(screen.getByText(/intentional line break/)).toHaveStyle({
    whiteSpace: 'pre-line'
  });
});
