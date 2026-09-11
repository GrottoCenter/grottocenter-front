import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';

import LinkedEntityCards from './LinkedEntityCards';

vi.mock('@/hooks', () => ({ useOnlineStatus: () => true }));

const messages = {
  unlink: 'unlink',
  Unlink: 'Unlink',
  No: 'No',
  close: 'Close',
  'Are you sure you want to unlink {name}?': 'Unlink {name}?'
};

const entities = [
  {
    id: 7,
    type: 'massif',
    iconType: 'massif',
    label: 'Vercors',
    secondary: 'Massif',
    url: '/ui/massifs/7'
  },
  {
    id: 42,
    type: 'entrance',
    iconType: 'entrance',
    label: 'Grotte exemple',
    secondary: 'Entrance',
    url: '/ui/entrances/42'
  }
];

const renderCards = ({ linkedEntities = entities, ...props } = {}) =>
  render(
    <MemoryRouter>
      <IntlProvider locale="en" messages={messages}>
        <LinkedEntityCards entities={linkedEntities} {...props} />
      </IntlProvider>
    </MemoryRouter>
  );

it('renders linked entities as cards without actions by default', () => {
  renderCards();

  expect(screen.getByRole('link', { name: /Vercors/ })).toHaveAttribute(
    'href',
    '/ui/massifs/7'
  );
  expect(screen.getByText('Massif')).toBeVisible();
  expect(screen.queryByRole('button', { name: /unlink/ })).toBeNull();
});

it('confirms an optional unlink action', async () => {
  const user = userEvent.setup();
  const onUnlink = vi.fn().mockResolvedValue(undefined);
  renderCards({ onUnlink });

  await user.click(screen.getByRole('button', { name: 'unlink Vercors' }));
  const dialog = screen.getByRole('dialog', { name: 'Unlink' });
  expect(within(dialog).getByText('Unlink Vercors?')).toBeVisible();
  await user.click(within(dialog).getByRole('button', { name: 'Unlink' }));

  expect(onUnlink).toHaveBeenCalledWith(entities[0]);
});

it('closes the unlink dialog when its entity is removed', async () => {
  const user = userEvent.setup();
  const onUnlink = vi.fn();
  const { rerender } = renderCards({ onUnlink });

  await user.click(screen.getByRole('button', { name: 'unlink Vercors' }));
  expect(screen.getByRole('dialog', { name: 'Unlink' })).toBeVisible();

  rerender(
    <MemoryRouter>
      <IntlProvider locale="en" messages={messages}>
        <LinkedEntityCards entities={[entities[1]]} onUnlink={onUnlink} />
      </IntlProvider>
    </MemoryRouter>
  );

  await waitFor(() => {
    expect(screen.queryByRole('dialog', { name: 'Unlink' })).toBeNull();
  });
});
