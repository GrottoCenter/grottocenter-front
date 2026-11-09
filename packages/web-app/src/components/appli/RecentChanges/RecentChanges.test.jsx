import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { onlineManager } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { createIntl } from 'react-intl';

import * as apiClient from '@/api/client';
import { getRecentChanges } from '@/conf/apiRoutes';
import {
  createTestQueryClient,
  renderWithProviders
} from '@/test/renderWithProviders';
import messages from '@/../public/lang/en.json';
import frenchMessages from '@/../public/lang/fr.json';
import PageTabs from '@/components/common/Layouts/PageTabs';
import { RECENT_CHANGES_SCOPES } from '@/utils/recentChanges';
import RecentChangesSection from './Section';

const change = id => ({
  date: '2026-11-07T12:00:00.000Z',
  authorId: 1,
  author: 'Paul',
  mainEntityType: 'entrance',
  mainEntityId: id,
  mainAction: 'update',
  subEntityTypes: [],
  name: `Entrance ${id}`
});

const renderSection = (scopeType, options = {}) =>
  renderWithProviders(
    <MemoryRouter>
      <RecentChangesSection
        scopeType={scopeType}
        scopeId={scopeType === 'country' ? 'FR' : 42}
      />
    </MemoryRouter>,
    { messages, ...options }
  );

beforeEach(() => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
});

afterEach(() => {
  onlineManager.setOnline(true);
  vi.restoreAllMocks();
});

it('formats the French period and cap from message parameters', () => {
  const intl = createIntl({ locale: 'fr', messages: frenchMessages });
  expect(
    intl.formatMessage(
      { id: RECENT_CHANGES_SCOPES.massif.description },
      { days: 14, limit: 250 }
    )
  ).toBe(
    'Dernières contributions concernant ce massif sur les 14 derniers jours (dans la limite des 250 dernières contributions).'
  );
});

it.each([
  ['country', 'FR'],
  ['region', 'FR-ARA'],
  ['massif', 42],
  ['organization', 42]
])('paginates all %s activity inside the section', async (type, id) => {
  const apiGet = vi
    .spyOn(apiClient, 'apiGet')
    .mockResolvedValueOnce({
      changes: Array.from({ length: 51 }, (_, i) => change(i + 1))
    })
    .mockResolvedValue({ changes: [change(51)] });
  renderWithProviders(
    <MemoryRouter>
      <RecentChangesSection scopeType={type} scopeId={id} />
    </MemoryRouter>,
    { messages }
  );
  await screen.findByText('Entrance 50');
  expect(screen.queryByText('Entrance 51')).toBeNull();
  expect(apiGet).toHaveBeenCalledWith(
    `${getRecentChanges}?offset=0&limit=51&${type}Id=${id}`
  );
  fireEvent.click(screen.getByRole('button', { name: 'Load more' }));
  await screen.findByText('Entrance 51');
  expect(apiGet).toHaveBeenLastCalledWith(
    `${getRecentChanges}?offset=50&limit=51&${type}Id=${id}`
  );
  expect(screen.queryByRole('button', { name: 'Load more' })).toBeNull();
  expect(screen.queryByTestId('see-all-recent-changes')).toBeNull();
});

it('explains an empty organization scope without hiding the section', async () => {
  vi.spyOn(apiClient, 'apiGet').mockResolvedValue({ changes: [] });
  renderSection('organization');
  expect(
    await screen.findByText('No activity in this scope in the last 7 days')
  ).toBeVisible();
  expect(
    screen.getByText(
      'Recent contributions by current members of this organization in the last 7 days (limited to the latest 500 contributions).'
    )
  ).toBeVisible();
  expect(screen.getByRole('heading', { name: /Activities/ })).toBeVisible();
});

it('uses a single French subtitle with intact accents on the massif card', async () => {
  vi.spyOn(apiClient, 'apiGet').mockResolvedValue({ changes: [] });
  renderWithProviders(
    <MemoryRouter>
      <RecentChangesSection scopeType="massif" scopeId={42} />
    </MemoryRouter>,
    { locale: 'fr', messages: frenchMessages }
  );
  expect(
    screen.getAllByText(
      'Dernières contributions concernant ce massif sur les 7 derniers jours (dans la limite des 500 dernières contributions).'
    )
  ).toHaveLength(1);
  expect(screen.getByText(/500/)).toBeVisible();
  expect(
    await screen.findByText(
      'Aucune activité dans ce périmètre au cours des 7 derniers jours'
    )
  ).toBeVisible();
});

it('retries a failed preview with the same scope', async () => {
  const apiGet = vi
    .spyOn(apiClient, 'apiGet')
    .mockRejectedValueOnce(new Error('Unavailable'))
    .mockResolvedValue({ changes: [change(1)] });
  renderSection('massif');
  fireEvent.click(await screen.findByRole('button', { name: 'Retry' }));
  await screen.findByText('Entrance 1');
  await waitFor(() => expect(apiGet).toHaveBeenCalledTimes(2));
  expect(apiGet).toHaveBeenLastCalledWith(
    `${getRecentChanges}?offset=0&limit=51&massifId=42`
  );
});

it('loads activity only on opening its tab and preserves pagination across tab changes', async () => {
  const apiGet = vi
    .spyOn(apiClient, 'apiGet')
    .mockResolvedValueOnce({
      changes: Array.from({ length: 51 }, (_, i) => change(i + 1))
    })
    .mockResolvedValue({ changes: [change(51)] });
  renderWithProviders(
    <MemoryRouter>
      <PageTabs
        tabs={[
          { id: 'information', label: 'Information' },
          { id: 'activities', label: 'Activities', lazy: true }
        ]}>
        <p>Information content</p>
        <RecentChangesSection scopeType="massif" scopeId={42} />
      </PageTabs>
    </MemoryRouter>,
    { messages }
  );
  expect(apiGet).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('tab', { name: 'Activities' }));
  await screen.findByText('Entrance 50');
  fireEvent.click(screen.getByRole('button', { name: 'Load more' }));
  await screen.findByText('Entrance 51');
  fireEvent.click(screen.getByRole('tab', { name: 'Information' }));
  expect(screen.getByText('Entrance 51')).not.toBeVisible();
  fireEvent.click(screen.getByRole('tab', { name: 'Activities' }));
  expect(screen.getByText('Entrance 51')).toBeVisible();
  expect(apiGet).toHaveBeenCalledTimes(2);
});

it('keeps loaded activity when the next page fails and retries its offset', async () => {
  const apiGet = vi
    .spyOn(apiClient, 'apiGet')
    .mockResolvedValueOnce({
      changes: Array.from({ length: 51 }, (_, i) => change(i + 1))
    })
    .mockRejectedValueOnce(new Error('Unavailable'))
    .mockResolvedValue({ changes: [change(51)] });
  renderSection('massif');
  await screen.findByText('Entrance 50');
  fireEvent.click(screen.getByRole('button', { name: 'Load more' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Retry' }));
  expect(screen.getByText('Entrance 1')).toBeVisible();
  await screen.findByText('Entrance 51');
  expect(apiGet.mock.calls.slice(1)).toEqual([
    [`${getRecentChanges}?offset=50&limit=51&massifId=42`],
    [`${getRecentChanges}?offset=50&limit=51&massifId=42`]
  ]);
});

it.each([1, 51])(
  'retries a paused background refetch from the first page with %s available changes',
  async count => {
    const apiGet = vi
      .spyOn(apiClient, 'apiGet')
      .mockResolvedValueOnce({
        changes: Array.from({ length: count }, (_, i) => change(i + 1))
      })
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValue({ changes: [change(100)] });
    const queryClient = createTestQueryClient();
    queryClient.setDefaultOptions({
      queries: {
        networkMode: 'offlineFirst',
        retry: 1,
        retryDelay: 0,
        gcTime: Infinity
      }
    });
    renderSection('massif', { queryClient });
    await screen.findByText('Entrance 1');

    act(() => {
      onlineManager.setOnline(false);
      queryClient.refetchQueries();
    });
    expect(await screen.findByTestId('fetch-error-state')).toHaveTextContent(
      messages.offlineContentUnavailable
    );
    expect(screen.getByText('Entrance 1')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    await screen.findByText('Entrance 100');
    expect(apiGet.mock.calls).toEqual(
      Array.from({ length: 3 }, () => [
        `${getRecentChanges}?offset=0&limit=51&massifId=42`
      ])
    );
    expect(screen.queryByTestId('fetch-error-state')).toBeNull();
  }
);

it('retries a paused next page without losing Load more, then refreshes loaded pages', async () => {
  const firstPage = {
    changes: Array.from({ length: 51 }, (_, i) => change(i + 1))
  };
  const apiGet = vi
    .spyOn(apiClient, 'apiGet')
    .mockResolvedValueOnce(firstPage)
    .mockRejectedValueOnce(new TypeError('Failed to fetch'))
    .mockResolvedValueOnce({ changes: [change(51)] })
    .mockRejectedValueOnce(new TypeError('Failed to fetch'))
    .mockResolvedValueOnce(firstPage)
    .mockResolvedValue({ changes: [change(51)] });
  const queryClient = createTestQueryClient();
  queryClient.setDefaultOptions({
    queries: {
      networkMode: 'offlineFirst',
      retry: 1,
      retryDelay: 0,
      gcTime: Infinity
    }
  });
  renderSection('massif', { queryClient });
  await screen.findByText('Entrance 50');

  act(() => onlineManager.setOnline(false));
  fireEvent.click(screen.getByRole('button', { name: 'Load more' }));
  expect(await screen.findByTestId('fetch-error-state')).toHaveTextContent(
    messages.offlineContentUnavailable
  );
  expect(screen.getByText('Entrance 1')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  await screen.findByText('Entrance 51');
  expect(apiGet.mock.calls).toEqual(
    [0, 50, 50].map(offset => [
      `${getRecentChanges}?offset=${offset}&limit=51&massifId=42`
    ])
  );
  expect(screen.queryByRole('button', { name: 'Load more' })).toBeNull();
  expect(screen.queryByTestId('fetch-error-state')).toBeNull();

  act(() => {
    queryClient.refetchQueries();
  });
  expect(await screen.findByTestId('fetch-error-state')).toHaveTextContent(
    messages.offlineContentUnavailable
  );
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  await waitFor(() =>
    expect(screen.queryByTestId('fetch-error-state')).toBeNull()
  );
  expect(screen.getByText('Entrance 51')).toBeVisible();
  expect(apiGet.mock.calls).toEqual(
    [0, 50, 50, 0, 0, 50].map(offset => [
      `${getRecentChanges}?offset=${offset}&limit=51&massifId=42`
    ])
  );
});
