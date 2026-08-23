import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, screen, waitFor } from '@testing-library/react';

import * as apiClient from '@/api/client';
import { getRecentChanges } from '@/conf/apiRoutes';
import { renderWithProviders } from '@/test/renderWithProviders';
import RecentChangesPage from './index';

const messages = {
  'Load more': 'Load more',
  'No recent changes': 'No recent changes',
  'Recent changes': 'Recent changes',
  'Changes from the last 7 days, limited to the latest 500 recorded operations':
    'Changes from the last 7 days, limited to the latest 500 recorded operations',
  'the cave': 'the cave',
  unknown: 'unknown',
  updated: 'updated'
};

const makeChange = id => ({
  date: new Date(Date.UTC(2026, 7, 16, 12, id)).toISOString(),
  authorId: 1,
  author: 'Paul',
  mainEntityType: 'cave',
  mainEntityId: id,
  mainAction: 'update',
  subEntityTypes: [],
  subAction: null,
  name: `Change ${id}`
});

afterEach(() => {
  vi.restoreAllMocks();
});

it('loads additional changes by advancing the server offset', async () => {
  const apiGet = vi
    .spyOn(apiClient, 'apiGet')
    .mockResolvedValueOnce({
      changes: Array.from({ length: 51 }, (_, i) => makeChange(i + 1))
    })
    .mockResolvedValueOnce({ changes: [makeChange(51), makeChange(52)] });

  renderWithProviders(
    <IntlProvider locale="en" messages={messages}>
      <MemoryRouter>
        <RecentChangesPage />
      </MemoryRouter>
    </IntlProvider>
  );

  expect(screen.getByRole('heading', { name: 'Recent changes' })).toBeVisible();
  expect(
    screen.getByText(
      'Changes from the last 7 days, limited to the latest 500 recorded operations'
    )
  ).toBeVisible();

  await screen.findByText('Change 50');
  fireEvent.click(screen.getByRole('button', { name: 'Load more' }));

  await screen.findByText('Change 52');
  await waitFor(() =>
    expect(apiGet).toHaveBeenNthCalledWith(
      2,
      `${getRecentChanges}?offset=50&limit=51`
    )
  );
  expect(
    screen.queryByRole('button', { name: 'Load more' })
  ).not.toBeInTheDocument();
});
