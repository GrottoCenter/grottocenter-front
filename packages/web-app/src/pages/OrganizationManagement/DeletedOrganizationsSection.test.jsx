import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { renderWithProviders } from '@/test/renderWithProviders';
import messages from '@/../public/lang/en.json';
import { apiDelete, apiGet, apiGetWithRange } from '@/api/client';
import { useOnlineStatus, usePermissions } from '@/hooks';
import { getOrganizationUrl, getOrganizationsUrl } from '@/conf/apiRoutes';
import { organizationKeys } from '@/api/queryKeys';
import DeletedOrganizationsSection from './DeletedOrganizationsSection';

vi.mock('@/api/client', () => ({
  apiDelete: vi.fn(),
  apiGet: vi.fn(),
  apiGetWithRange: vi.fn()
}));
vi.mock('@/hooks', async importOriginal => ({
  ...(await importOriginal()),
  usePermissions: vi.fn(),
  useOnlineStatus: vi.fn()
}));
vi.mock('@/hooks/useNotification', () => ({
  useNotification: () => ({ onSuccess: vi.fn() })
}));

const source = { id: 42, name: 'Old club', isDeleted: true };
const target = { id: 43, name: 'Surviving club', isDeleted: false };

const renderSection = (props = {}) => {
  const onPreview = vi.fn();
  return {
    onPreview,
    ...renderWithProviders(
      <MemoryRouter>
        <DeletedOrganizationsSection enabled onPreview={onPreview} {...props} />
      </MemoryRouter>,
      { messages }
    )
  };
};

const openConfirmation = async () => {
  fireEvent.click(
    await screen.findByTestId('permanent-delete-organization-42')
  );
  return screen.findByRole('dialog');
};

beforeEach(() => {
  vi.resetAllMocks();
  usePermissions.mockReturnValue({ isAdmin: true });
  useOnlineStatus.mockReturnValue(true);
  apiGetWithRange.mockResolvedValue({
    data: { organizations: [source] },
    contentRange: '0-1/1'
  });
  apiGet.mockImplementation(url =>
    Promise.resolve(url.endsWith('/42') ? source : target)
  );
  apiDelete.mockResolvedValue(source);
});

it('shows the server total, preview and a new-tab link, without edit actions', async () => {
  const { onPreview } = renderSection();
  const row = within(await screen.findByTestId('deleted-organization-42'));
  expect(screen.getByTestId('deleted-organizations-count')).toHaveTextContent(
    'Soft-deleted organizations: 1'
  );
  expect(apiGetWithRange).toHaveBeenCalledWith(
    `${getOrganizationsUrl}?isDeleted=true&limit=50&skip=0`
  );
  fireEvent.click(
    row.getByRole('button', { name: 'View organization Old club (#42)' })
  );
  expect(onPreview).toHaveBeenCalledWith(42);
  const link = row.getByRole('link', {
    name: messages['Open organization {name} in new tab'].replace(
      '{name}',
      'Old club (#42)'
    )
  });
  expect(link).toHaveAttribute('href', '/ui/organizations/42');
  expect(link).toHaveAttribute('target', '_blank');
  expect(row.queryByRole('link', { name: /Edit organization/ })).toBeNull();
  expect(apiGet).not.toHaveBeenCalled();
});

it('loads every page using skip and keeps the total distinct from the loaded count', async () => {
  const firstPage = Array.from({ length: 50 }, (_, index) => ({
    id: index + 100,
    name: `Deleted club ${index}`,
    isDeleted: true
  }));
  apiGetWithRange
    .mockResolvedValueOnce({
      data: { organizations: firstPage },
      contentRange: '0-50/51'
    })
    .mockResolvedValueOnce({
      data: { organizations: [source] },
      contentRange: '50-51/51'
    });
  renderSection();
  const loadMore = await screen.findByRole('button', { name: 'Load more' });
  expect(screen.getByTestId('deleted-organizations-count')).toHaveTextContent(
    '51'
  );
  fireEvent.click(loadMore);
  await screen.findByTestId('deleted-organization-42');
  expect(apiGetWithRange).toHaveBeenLastCalledWith(
    `${getOrganizationsUrl}?isDeleted=true&limit=50&skip=50`
  );
  expect(screen.getAllByRole('listitem')).toHaveLength(51);
  expect(screen.queryByRole('button', { name: 'Load more' })).toBeNull();
});

it('confirms without a redirect, then refreshes the list and total after permanent deletion', async () => {
  renderSection();
  const dialog = within(await openConfirmation());
  expect(dialog.getByRole('combobox')).toBeVisible();
  expect(
    dialog.getByRole('button', { name: 'Permanently delete' })
  ).toBeEnabled();
  apiGetWithRange.mockResolvedValue({
    data: { organizations: [] },
    contentRange: null
  });
  fireEvent.click(dialog.getByRole('button', { name: 'Permanently delete' }));
  await waitFor(() => expect(apiDelete).toHaveBeenCalledTimes(1));
  expect(apiDelete).toHaveBeenCalledWith(
    `${getOrganizationUrl}42?isPermanent=1`
  );
  await screen.findByText('No soft-deleted organizations.');
  expect(screen.getByTestId('deleted-organizations-count')).toHaveTextContent(
    'Soft-deleted organizations: 0'
  );
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(screen.queryByTestId('deleted-organization-42')).toBeNull();
});

it('reloads cached details and preserves the existing redirect as the merge destination', async () => {
  apiGet.mockImplementation(url =>
    Promise.resolve(
      url.endsWith('/42') ? { ...source, redirectTo: target.id } : target
    )
  );
  const { queryClient } = renderSection();
  queryClient.setQueryData(organizationKeys.detail(42), {
    ...source,
    isDeleted: false,
    redirectTo: null
  });
  const dialog = within(await openConfirmation());
  await dialog.findByText('Surviving club');
  expect(dialog.queryByRole('link')).toBeNull();
  expect(dialog.queryByRole('combobox')).toBeNull();
  expect(apiDelete).not.toHaveBeenCalled();
  fireEvent.click(
    dialog.getByRole('button', { name: 'Merge and permanently delete' })
  );
  await waitFor(() =>
    expect(apiDelete).toHaveBeenCalledWith(
      `${getOrganizationUrl}42?isPermanent=1&entityId=43`
    )
  );
});

it('blocks deletion until the redirect destination has been resolved', async () => {
  let resolveTarget;
  apiGet.mockImplementation(url =>
    url.endsWith('/42')
      ? Promise.resolve({ ...source, redirectTo: target.id })
      : new Promise(resolve => {
          resolveTarget = resolve;
        })
  );
  renderSection();
  const dialog = within(await openConfirmation());
  await waitFor(() => expect(resolveTarget).toBeTypeOf('function'));
  expect(
    dialog.getByRole('button', { name: 'Permanently delete' })
  ).toBeDisabled();
  expect(apiDelete).not.toHaveBeenCalled();
  resolveTarget(target);
  await waitFor(() =>
    expect(
      dialog.getByRole('button', { name: 'Merge and permanently delete' })
    ).toBeEnabled()
  );
});

it('does not open the confirmation for an organization restored since the list was loaded', async () => {
  apiGet.mockResolvedValue({ ...source, isDeleted: false });
  renderSection();
  fireEvent.click(
    await screen.findByTestId('permanent-delete-organization-42')
  );
  expect(await screen.findByRole('alert')).toHaveTextContent(
    messages['deletedOrganizations.changed']
  );
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(apiDelete).not.toHaveBeenCalled();
});

it.each([
  { ...source, redirectTo: 42 },
  { ...source, redirectTo: 44 }
])(
  'uses the shared dialog to block an unavailable redirect: %j',
  async detail => {
    apiGet.mockImplementation(url =>
      Promise.resolve(
        url.endsWith('/42') ? detail : { id: 44, isDeleted: true }
      )
    );
    renderSection();
    const dialog = within(await openConfirmation());
    await dialog.findByRole('alert');
    expect(
      dialog.getByRole('button', { name: 'Permanently delete' })
    ).toBeDisabled();
    expect(apiDelete).not.toHaveBeenCalled();
  }
);

it('shows deletion failures in the list and allows retrying through the shared dialog', async () => {
  apiDelete.mockRejectedValueOnce(new Error('Deletion failed'));
  renderSection();
  const dialog = within(await openConfirmation());
  fireEvent.click(dialog.getByRole('button', { name: 'Permanently delete' }));
  await screen.findByRole('alert');
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(screen.getByTestId('deleted-organization-42')).toBeVisible();
  const reopenedDialog = within(await openConfirmation());
  fireEvent.click(
    reopenedDialog.getByRole('button', { name: 'Permanently delete' })
  );
  await waitFor(() => expect(apiDelete).toHaveBeenCalledTimes(2));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
});

it('does not delete when the user cancels', async () => {
  renderSection();
  const dialog = within(await openConfirmation());
  fireEvent.click(dialog.getByRole('button', { name: 'Cancel' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(apiDelete).not.toHaveBeenCalled();
});

it('lets moderators browse without exposing permanent deletion', async () => {
  usePermissions.mockReturnValue({ isAdmin: false });
  renderSection();
  await screen.findByTestId('deleted-organization-42');
  expect(
    screen.queryByRole('button', { name: 'Permanently delete' })
  ).toBeNull();
});

it('disables permanent deletion offline', async () => {
  useOnlineStatus.mockReturnValue(false);
  renderSection();
  expect(
    await screen.findByRole('button', { name: 'Permanently delete' })
  ).toBeDisabled();
});

it('shows list errors and retries without a page reload', async () => {
  apiGetWithRange.mockRejectedValueOnce(new Error('List unavailable'));
  renderSection();
  fireEvent.click(await screen.findByRole('button', { name: 'Retry' }));
  await screen.findByTestId('deleted-organization-42');
});

it('does not load the list while its tab is inactive', () => {
  renderSection({ enabled: false });
  expect(apiGetWithRange).not.toHaveBeenCalled();
});

it.each([
  {
    data: { organizations: [{ ...source, isDeleted: false }] },
    contentRange: null
  },
  { data: { organizations: [source, target] }, contentRange: '0-2/2' },
  { data: { organizations: [source] }, contentRange: null }
])(
  'rejects an incompatible API response without displaying a false count: %j',
  async page => {
    apiGetWithRange.mockResolvedValue(page);
    renderSection();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      messages['deletedOrganizations.listUnavailable']
    );
    expect(screen.queryByTestId('deleted-organizations-count')).toBeNull();
    expect(screen.queryByRole('listitem')).toBeNull();
    expect(
      screen.queryByRole('button', { name: 'Permanently delete' })
    ).toBeNull();
  }
);
