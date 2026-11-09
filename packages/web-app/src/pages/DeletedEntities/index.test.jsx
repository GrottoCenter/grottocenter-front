import {
  act,
  fireEvent,
  screen,
  waitFor,
  within
} from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { apiDelete, apiGet, apiGetWithRange, apiPost } from '@/api/client';
import { renderWithProviders } from '@/test/renderWithProviders';
import messages from '@/../public/lang/en.json';
import { DELETED_ENTITY_RESOURCES } from '@/utils/deletedEntities';
import { organizationKeys } from '@/api/queryKeys';
import { getOrganizationIconSource } from '@/utils/organizationIcons';
import { useDeletedEntityCounts } from '@/hooks';
import DeletedEntities from './index';

let isOnline;

vi.mock('@/api/client', () => ({
  apiGet: vi.fn(),
  apiGetWithRange: vi.fn(),
  apiDelete: vi.fn(),
  apiPost: vi.fn()
}));
vi.mock('@/hooks', async importOriginal => ({
  ...(await importOriginal()),
  useOnlineStatus: () => isOnline,
  useDeletedEntityCounts: vi.fn()
}));
vi.mock('@/hooks/useNotification', () => ({
  useNotification: () => ({ onSuccess: vi.fn() })
}));

let source;
let hasRow;
const resources = Object.keys(DELETED_ENTITY_RESOURCES);
const pageResponse = (
  resource,
  entities = [source],
  total = entities.length
) => ({
  data: { [resource]: entities },
  contentRange: entities.length ? `0-${entities.length}/${total}` : null
});

const renderPage = (
  resource = 'organizations',
  groups = ['Administrator'],
  params = ''
) =>
  renderWithProviders(
    <MemoryRouter
      initialEntries={[`/ui/deleted-entities?type=${resource}${params}`]}>
      <Routes>
        <Route path="/ui/deleted-entities" element={<DeletedEntities />} />
        <Route path="/" element={<p>Access denied</p>} />
      </Routes>
    </MemoryRouter>,
    {
      messages,
      preloadedState: {
        login: {
          authTokenDecoded: {
            id: 1,
            exp: Date.now() / 1000 + 3600,
            groups: groups.map(name => ({ name }))
          }
        }
      }
    }
  );

const openAction = async action => {
  fireEvent.click(await screen.findByRole('button', { name: action }));
  await waitFor(() =>
    expect(screen.getByRole('button', { name: action })).toBeEnabled()
  );
  return within(screen.getByRole('dialog'));
};

beforeEach(() => {
  vi.resetAllMocks();
  useDeletedEntityCounts.mockReturnValue([]);
  source = { id: 42, name: 'Deleted record', isDeleted: true, entrances: [] };
  hasRow = true;
  isOnline = true;
  apiGet.mockImplementation(() => Promise.resolve(source));
  apiGetWithRange.mockImplementation(url => {
    const resource = new URL(url).pathname.split('/').pop();
    return Promise.resolve(pageResponse(resource, hasRow ? [source] : []));
  });
  apiDelete.mockImplementation(() => {
    hasRow = false;
    return Promise.resolve(source);
  });
  apiPost.mockImplementation(() => {
    hasRow = false;
    return Promise.resolve({ ...source, isDeleted: false });
  });
});

describe.each(resources)('%s', resource => {
  it.each([['Administrator'], ['Moderator'], ['Administrator', 'Moderator']])(
    'lists deleted records for %j with the server total and a detail link',
    async (...groups) => {
      apiGetWithRange.mockResolvedValue(pageResponse(resource, [source], 126));
      renderPage(resource, groups);
      const config = DELETED_ENTITY_RESOURCES[resource];
      expect(
        await screen.findByTestId(`open-${config.kind}-42`)
      ).toHaveAttribute('href', `${config.entityType.url}42`);
      expect(screen.getByTestId('deleted-entities-count')).toHaveTextContent(
        '126 results'
      );
      const [url, options] = apiGetWithRange.mock.calls[0];
      expect(new URL(url).searchParams.get('isDeleted')).toBe('true');
      expect(new URL(url).searchParams.has('isValidated')).toBe(false);
      expect(options.signal).toBeInstanceOf(AbortSignal);
      expect(
        screen.queryByRole('button', { name: 'Permanently delete' }) !== null
      ).toBe(groups.includes('Administrator'));
    }
  );

  it.each([['Administrator'], ['Moderator']])(
    'restores with %j and refreshes the row and total',
    async (...groups) => {
      renderPage(resource, groups);
      const dialog = await openAction('Restore');
      fireEvent.click(dialog.getByRole('button', { name: 'Restore' }));
      await screen.findByText(messages['deletedEntities.empty']);
      expect(apiPost).toHaveBeenCalledWith(
        `${DELETED_ENTITY_RESOURCES[resource].collectionUrl}/42/restore`
      );
      expect(screen.getByTestId('deleted-entities-count')).toHaveTextContent(
        '0 results'
      );
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
      expect(apiGet.mock.calls.length).toBeGreaterThanOrEqual(2);
    }
  );

  it('permanently deletes with explicit isPermanent after confirmation', async () => {
    renderPage(resource);
    const dialog = await openAction('Permanently delete');
    expect(dialog.getByText('Deleted record (#42)')).toBeVisible();
    expect(apiDelete).not.toHaveBeenCalled();
    fireEvent.click(dialog.getByRole('button', { name: 'Permanently delete' }));
    await waitFor(() => expect(apiDelete).toHaveBeenCalledTimes(1));
    expect(
      new URL(apiDelete.mock.calls[0][0]).searchParams.get('isPermanent')
    ).toBe('1');
    await screen.findByText(messages['deletedEntities.empty']);
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
});

it.each([[], ['User'], ['Leader']])(
  'denies direct access to %j without fetching',
  async (...groups) => {
    renderPage('organizations', groups);
    expect(await screen.findByText('Access denied')).toBeVisible();
    expect(apiGetWithRange).not.toHaveBeenCalled();
  }
);

it('cancels without writing', async () => {
  renderPage();
  const dialog = await openAction('Permanently delete');
  fireEvent.click(dialog.getByRole('button', { name: 'Cancel' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(apiDelete).not.toHaveBeenCalled();
});

it('keeps API conflict details visible and allows retrying', async () => {
  apiDelete.mockRejectedValueOnce(
    Object.assign(new Error('Linked content must be moved first'), {
      status: 409
    })
  );
  renderPage();
  const dialog = await openAction('Permanently delete');
  fireEvent.click(dialog.getByRole('button', { name: 'Permanently delete' }));
  expect(await dialog.findByRole('alert')).toHaveTextContent(
    'Linked content must be moved first'
  );
  expect(screen.getByTestId('deleted-organization-42')).toBeVisible();
  fireEvent.click(dialog.getByRole('button', { name: 'Permanently delete' }));
  await screen.findByText(messages['deletedEntities.empty']);
});

it('does not act on a record restored while the confirmation was open', async () => {
  renderPage();
  const dialog = await openAction('Permanently delete');
  apiGet.mockResolvedValue({ ...source, isDeleted: false });
  fireEvent.click(dialog.getByRole('button', { name: 'Permanently delete' }));
  expect(await dialog.findByRole('alert')).toHaveTextContent(
    messages['deletedEntities.changed']
  );
  expect(apiDelete).not.toHaveBeenCalled();
});

it('preselects the existing destination and passes it to the deletion hook', async () => {
  source = { ...source, redirectTo: 43 };
  apiGet.mockImplementation(url =>
    Promise.resolve(
      url.endsWith('/43')
        ? { id: 43, name: 'Destination', isDeleted: false }
        : source
    )
  );
  renderPage();
  const link = await screen.findByRole('link', {
    name: 'Destination'
  });
  expect(link).toHaveAttribute('href', '/ui/organizations/43');
  fireEvent.click(screen.getByRole('button', { name: 'Permanently delete' }));
  const confirm = await screen.findByRole('button', {
    name: 'Merge and permanently delete'
  });
  fireEvent.click(confirm);
  await waitFor(() => expect(apiDelete).toHaveBeenCalledTimes(1));
  expect(new URL(apiDelete.mock.calls[0][0]).searchParams.get('entityId')).toBe(
    '43'
  );
});

it('requires a merge destination for caves with attached entrances', async () => {
  source = { ...source, entrances: [{ id: 17 }], nbEntrances: 1 };
  renderPage('caves');
  fireEvent.click(
    await screen.findByRole('button', { name: 'Permanently delete' })
  );
  expect(
    await screen.findByRole('button', { name: 'Merge and permanently delete' })
  ).toBeDisabled();
  expect(apiDelete).not.toHaveBeenCalled();
});

it('loads only the requested server page and recovers after its last row is removed', async () => {
  apiGetWithRange.mockImplementation(url => {
    const skip = Number(new URL(url).searchParams.get('skip'));
    if (skip === 50 && !hasRow)
      return Promise.resolve(pageResponse('organizations', []));
    return Promise.resolve(
      pageResponse('organizations', [source], hasRow ? 51 : 50)
    );
  });
  renderPage('organizations', ['Administrator'], '&page=2');
  await screen.findByTestId('deleted-organization-42');
  expect(apiGetWithRange.mock.calls).toHaveLength(1);
  expect(
    new URL(apiGetWithRange.mock.calls[0][0]).searchParams.get('skip')
  ).toBe('50');
  const dialog = await openAction('Permanently delete');
  fireEvent.click(dialog.getByRole('button', { name: 'Permanently delete' }));
  await waitFor(() =>
    expect(screen.getByTestId('deleted-entities-count')).toHaveTextContent(
      '50 results'
    )
  );
  expect(
    new URL(apiGetWithRange.mock.lastCall[0]).searchParams.get('skip')
  ).toBe('0');
});

it.each(['direct navigation', 'Restore', 'Permanently delete'])(
  'preserves the total during uncached last-page recovery after %s',
  async action => {
    const isDirectNavigation = action === 'direct navigation';
    const totalCount = isDirectNavigation ? 120 : 150;
    let resolvePage;
    apiGetWithRange.mockImplementation(url => {
      const skip = Number(new URL(url).searchParams.get('skip'));
      if (skip === 100) {
        return new Promise(resolve => {
          resolvePage = resolve;
        });
      }
      if (skip === 450 || (skip === 150 && !hasRow)) {
        return Promise.resolve(pageResponse('organizations', []));
      }
      return Promise.resolve(
        pageResponse(
          'organizations',
          [source],
          totalCount + (!isDirectNavigation && hasRow ? 1 : 0)
        )
      );
    });
    renderPage(
      'organizations',
      ['Administrator'],
      isDirectNavigation ? '&page=10' : '&page=4'
    );
    if (!isDirectNavigation) {
      const dialog = await openAction(action);
      fireEvent.click(dialog.getByRole('button', { name: action }));
    }
    await waitFor(() => expect(resolvePage).toBeTypeOf('function'));
    expect(screen.queryByText('0 results')).toBeNull();
    expect(screen.queryByText('0–0 / 0')).toBeNull();
    expect(screen.getByTestId('deleted-entities-count')).toHaveTextContent(
      `${totalCount} results`
    );
    expect(screen.getByText(`101–${totalCount} / ${totalCount}`)).toBeVisible();
    expect(screen.queryByText(messages['deletedEntities.empty'])).toBeNull();
    expect(screen.getByRole('progressbar')).toBeVisible();
    await act(async () =>
      resolvePage(
        pageResponse('organizations', [{ ...source, id: 43 }], totalCount)
      )
    );
    expect(await screen.findByTestId('deleted-organization-43')).toBeVisible();
    expect(screen.getByTestId('deleted-entities-count')).toHaveTextContent(
      `${totalCount} results`
    );
    expect(
      screen.getByText(isDirectNavigation ? '101–120 / 120' : '101–150 / 150')
    ).toBeVisible();
  }
);

it('stops showing the first-page total when an uncached recovery page fails', async () => {
  let rejectPage;
  apiGetWithRange.mockImplementation(url => {
    const skip = Number(new URL(url).searchParams.get('skip'));
    if (skip === 100) {
      return new Promise((_, reject) => {
        rejectPage = reject;
      });
    }
    return Promise.resolve(
      pageResponse('organizations', skip === 0 ? [source] : [], 120)
    );
  });
  renderPage('organizations', ['Administrator'], '&page=10');
  await waitFor(() => expect(rejectPage).toBeTypeOf('function'));
  expect(screen.getByTestId('deleted-entities-count')).toHaveTextContent(
    '120 results'
  );
  expect(screen.getByText('101–120 / 120')).toBeVisible();
  await act(async () => rejectPage(new Error('List unavailable')));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'List unavailable'
  );
  expect(screen.queryByTestId('deleted-entities-count')).toBeNull();
  expect(screen.queryByText('101–120 / 120')).toBeNull();
  expect(screen.getByText('0–0 / 0')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Retry' })).toBeEnabled();
});

it('shows list errors and retries', async () => {
  apiGetWithRange.mockRejectedValueOnce(new Error('List unavailable'));
  renderPage();
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'List unavailable'
  );
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  await screen.findByTestId('deleted-organization-42');
});

it.each(['page', 'limit'])(
  'keeps the rows, count and pagination while a new %s loads',
  async change => {
    apiGetWithRange.mockResolvedValue(
      pageResponse('organizations', [source], 126)
    );
    renderPage();
    await screen.findByTestId('deleted-organization-42');
    let resolvePage;
    apiGetWithRange.mockImplementation(
      () =>
        new Promise(resolve => {
          resolvePage = resolve;
        })
    );
    if (change === 'page') {
      fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    } else {
      fireEvent.mouseDown(
        screen.getByRole('combobox', { name: 'Results per page:' })
      );
      fireEvent.click(await screen.findByRole('option', { name: '20' }));
    }
    await waitFor(() => expect(apiGetWithRange).toHaveBeenCalledTimes(2));
    expect(screen.getByTestId('deleted-organization-42')).toBeVisible();
    expect(screen.getByTestId('deleted-entities-count')).toHaveTextContent(
      '126 results'
    );
    expect(
      screen.getByText(change === 'page' ? '51–100 / 126' : '1–20 / 126')
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Restore' })).toBeDisabled();
    expect(screen.queryByText(messages['deletedEntities.empty'])).toBeNull();
    await act(async () =>
      resolvePage(pageResponse('organizations', [{ ...source, id: 43 }], 126))
    );
    expect(await screen.findByTestId('deleted-organization-43')).toBeVisible();
    expect(screen.queryByTestId('deleted-organization-42')).toBeNull();
    expect(screen.getByRole('button', { name: 'Restore' })).toBeEnabled();
  }
);

it('does not show previous-resource rows while another resource loads', async () => {
  renderPage();
  await screen.findByTestId('deleted-organization-42');
  let resolvePage;
  apiGetWithRange.mockImplementation(
    () =>
      new Promise(resolve => {
        resolvePage = resolve;
      })
  );
  fireEvent.click(screen.getByRole('tab', { name: 'Massifs' }));
  await waitFor(() => expect(apiGetWithRange).toHaveBeenCalledTimes(2));
  expect(screen.queryByTestId('deleted-organization-42')).toBeNull();
  expect(screen.queryByTestId('deleted-massif-42')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Restore' })).toBeNull();
  await act(async () => resolvePage(pageResponse('massifs')));
  expect(await screen.findByTestId('deleted-massif-42')).toBeVisible();
});

it('shows all six icon tabs and loads the selected resource', async () => {
  renderPage();
  await screen.findByTestId('deleted-organization-42');
  expect(screen.getAllByRole('tab')).toHaveLength(6);
  resources.forEach(resource => {
    const config = DELETED_ENTITY_RESOURCES[resource];
    const tab = screen.getByRole('tab', {
      name: messages[config.labelId]
    });
    expect(tab.querySelector('img')).toHaveAttribute('src');
    fireEvent.click(tab);
    expect(tab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveAccessibleName(
      messages[config.labelId]
    );
  });
  expect(await screen.findByTestId('deleted-document-42')).toBeVisible();
  expect(apiGetWithRange).toHaveBeenCalled();
  expect(apiPost).not.toHaveBeenCalled();
  expect(apiDelete).not.toHaveBeenCalled();
});

it('shows each resource total in its tab', () => {
  useDeletedEntityCounts.mockReturnValue(
    resources.map((_, index) => ({ data: { totalCount: index + 10 } }))
  );
  renderPage();
  resources.forEach((resource, index) => {
    expect(
      within(screen.getByTestId(`page-tab-${resource}`)).getByText(
        String(index + 10)
      )
    ).toBeVisible();
  });
});

it('uses organization type icons, muted IDs and a named merge destination', async () => {
  source = { ...source, type: 'SPELEOLOGY', redirectTo: 43 };
  apiGet.mockResolvedValue({ id: 43, name: 'Destination club' });
  renderPage();
  const row = within(await screen.findByTestId('deleted-organization-42'));
  expect(row.getByText('#42')).toBeVisible();
  expect(row.queryByText(/\(#42\)/)).toBeNull();
  expect(row.queryByText('Deleted')).toBeNull();
  expect(row.queryByText('fra')).toBeNull();
  expect(row.queryByText(messages['organizationType.speleology'])).toBeNull();
  expect(
    screen.getByTestId('deleted-organization-42').querySelector('img')
  ).toHaveAttribute('src', getOrganizationIconSource('SPELEOLOGY'));
  expect(
    await screen.findByRole('link', { name: 'Destination club' })
  ).toHaveAttribute('href', '/ui/organizations/43');
  expect(screen.queryByRole('heading', { name: 'Organizations' })).toBeNull();
});

it.each([
  ['Article', 'ArticleIcon'],
  ['Map', 'MapIcon'],
  ['Book', 'MenuBookIcon']
])('uses the %s icon instead of a document type label', async (type, icon) => {
  source = { ...source, type, title: 'Deleted document' };
  renderPage('documents');
  const row = within(await screen.findByTestId('deleted-document-42'));
  expect(row.getByTestId(icon)).toBeVisible();
  expect(row.queryByText(type)).toBeNull();
  expect(row.queryByText(/Français|English/)).toBeNull();
});

it('opens and closes the preview with additional details', async () => {
  apiGet.mockResolvedValue({
    ...source,
    address: 'Club address',
    description: 'Club details'
  });
  renderPage();
  fireEvent.click(
    within(await screen.findByTestId('deleted-organization-42')).getByRole(
      'button',
      { name: 'Preview' }
    )
  );
  const dialog = within(screen.getByRole('dialog'));
  expect(await dialog.findByText('Club address')).toBeVisible();
  expect(dialog.getByText('Club details')).toBeVisible();
  fireEvent.click(dialog.getByRole('button', { name: 'close' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
});

it('loads the selected entity details in the preview window', async () => {
  apiGet.mockResolvedValue({
    ...source,
    description: 'Full archived description'
  });
  renderPage();
  fireEvent.click(await screen.findByRole('button', { name: 'Preview' }));
  const dialog = within(screen.getByRole('dialog'));
  expect(await dialog.findByText('Full archived description')).toBeVisible();
  expect(dialog.getByRole('link', { name: 'Details' })).toHaveAttribute(
    'href',
    '/ui/organizations/42'
  );
  expect(apiGet).toHaveBeenCalledWith(
    `${DELETED_ENTITY_RESOURCES.organizations.collectionUrl}/42`,
    expect.objectContaining({ signal: expect.any(AbortSignal) })
  );
  expect(apiPost).not.toHaveBeenCalled();
  expect(apiDelete).not.toHaveBeenCalled();
});

it('rejects a response containing active records', async () => {
  apiGetWithRange.mockResolvedValue(
    pageResponse('organizations', [{ ...source, isDeleted: false }])
  );
  renderPage();
  expect(await screen.findByRole('alert')).toHaveTextContent(
    messages['deletedEntities.listUnavailable']
  );
  expect(screen.queryByTestId('deleted-organization-42')).toBeNull();
});

it('falls back to the ID when no readable name is present', async () => {
  source = { id: 42, isDeleted: true };
  renderPage();
  expect(await screen.findByRole('link', { name: '#42' })).toBeVisible();
});

it('keeps deleted documents in every validation state', async () => {
  const documents = [
    { id: 41, title: 'Validated', isDeleted: true, isValidated: true },
    {
      id: 42,
      title: 'Pending',
      isDeleted: true,
      isValidated: false,
      dateValidation: null
    },
    {
      id: 43,
      title: 'Refused',
      isDeleted: true,
      isValidated: false,
      dateValidation: '2026-01-01'
    }
  ];
  apiGetWithRange.mockResolvedValue(pageResponse('documents', documents));
  renderPage('documents');
  await screen.findByRole('link', { name: 'Refused' });
  expect(screen.getByRole('link', { name: 'Validated' })).toBeVisible();
  expect(screen.getByRole('link', { name: 'Pending' })).toBeVisible();
  expect(
    new URL(apiGetWithRange.mock.calls[0][0]).searchParams.has('isValidated')
  ).toBe(false);
});

it.each([403, 404, 409])(
  'keeps the API reason visible when restoration fails with %s',
  async status => {
    apiPost.mockRejectedValue(
      Object.assign(new Error('The linked cave must be restored first'), {
        status
      })
    );
    renderPage();
    const dialog = await openAction('Restore');
    fireEvent.click(dialog.getByRole('button', { name: 'Restore' }));
    expect(await dialog.findByRole('alert')).toHaveTextContent(
      'The linked cave must be restored first'
    );
    expect(screen.getByRole('dialog')).toBeVisible();
    expect(screen.getByTestId('deleted-organization-42')).toBeInTheDocument();
  }
);

it('prevents duplicate restoration submissions', async () => {
  let resolveRestore;
  apiPost.mockImplementation(
    () =>
      new Promise(resolve => {
        resolveRestore = resolve;
      })
  );
  renderPage();
  const dialog = await openAction('Restore');
  const confirm = dialog.getByRole('button', { name: 'Restore' });
  fireEvent.click(confirm);
  fireEvent.click(confirm);
  await waitFor(() => expect(apiPost).toHaveBeenCalledTimes(1));
  expect(confirm).toBeDisabled();
  hasRow = false;
  resolveRestore({ ...source, isDeleted: false });
  await screen.findByText(messages['deletedEntities.empty']);
});

it('disables actions offline', async () => {
  isOnline = false;
  renderPage();
  expect(await screen.findByRole('button', { name: 'Restore' })).toBeDisabled();
  expect(
    screen.getByRole('button', { name: 'Permanently delete' })
  ).toBeDisabled();
});

it('fetches fresh details instead of acting on a cached deleted flag', async () => {
  const { queryClient } = renderPage();
  await screen.findByTestId('deleted-organization-42');
  queryClient.setQueryData(organizationKeys.detail(42), {
    ...source,
    isDeleted: false
  });
  const dialog = await openAction('Permanently delete');
  expect(dialog.getByText('Deleted record (#42)')).toBeVisible();
  expect(apiGet).toHaveBeenCalledWith(
    `${DELETED_ENTITY_RESOURCES.organizations.collectionUrl}/42`
  );
  expect(apiDelete).not.toHaveBeenCalled();
});

it('waits for fresh source details before resolving a cached merge destination', async () => {
  source = { ...source, redirectTo: 44 };
  apiGet.mockImplementation(url =>
    Promise.resolve(
      url.endsWith('/42')
        ? source
        : { id: 44, name: 'Fresh destination', isDeleted: false }
    )
  );
  const { queryClient } = renderPage();
  await screen.findByTestId('deleted-organization-42');
  queryClient.setQueryData(organizationKeys.detail(42), {
    ...source,
    redirectTo: 43
  });
  fireEvent.click(screen.getByRole('button', { name: 'Permanently delete' }));
  expect(await screen.findByText('Fresh destination')).toBeVisible();
  expect(apiGet.mock.calls.some(([url]) => url.endsWith('/43'))).toBe(false);
  fireEvent.click(
    await screen.findByRole('button', { name: 'Merge and permanently delete' })
  );
  await waitFor(() => expect(apiDelete).toHaveBeenCalledTimes(1));
  expect(new URL(apiDelete.mock.calls[0][0]).searchParams.get('entityId')).toBe(
    '44'
  );
});

it('reports a source-detail failure and retries without writing', async () => {
  apiGet.mockRejectedValueOnce(
    Object.assign(new Error('Details unavailable'), { status: 403 })
  );
  renderPage();
  fireEvent.click(
    await screen.findByRole('button', { name: 'Permanently delete' })
  );
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Details unavailable'
  );
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Permanently delete' })
    ).toBeEnabled()
  );
  expect(apiDelete).not.toHaveBeenCalled();
});
