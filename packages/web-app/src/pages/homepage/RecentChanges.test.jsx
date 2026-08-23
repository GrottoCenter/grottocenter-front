import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import { screen, waitFor } from '@testing-library/react';

import * as apiClient from '@/api/client';
import { getRecentChanges } from '@/conf/apiRoutes';
import { renderWithProviders } from '@/test/renderWithProviders';
import RecentChanges from './RecentChanges';

const messages = {
  'No recent changes': 'No recent changes',
  'Recent changes': 'Recent changes',
  'See all recent changes': 'See all recent changes'
};

afterEach(() => {
  vi.restoreAllMocks();
});

it('loads a bounded preview and links to the full recent changes page', async () => {
  const apiGet = vi
    .spyOn(apiClient, 'apiGet')
    .mockResolvedValue({ changes: [] });

  renderWithProviders(
    <IntlProvider locale="en" messages={messages}>
      <MemoryRouter>
        <RecentChanges />
      </MemoryRouter>
    </IntlProvider>
  );

  expect(
    screen.getByRole('link', { name: 'See all recent changes' })
  ).toHaveAttribute('href', '/ui/changes/recent');
  await waitFor(() =>
    expect(apiGet).toHaveBeenCalledWith(`${getRecentChanges}?offset=0&limit=11`)
  );
});
