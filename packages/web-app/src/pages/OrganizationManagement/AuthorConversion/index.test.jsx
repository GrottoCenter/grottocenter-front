import {
  act,
  fireEvent,
  screen,
  waitFor,
  within
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { renderWithProviders } from '@/test/renderWithProviders';
import messages from '@/../public/lang/en.json';
import { apiGet, apiGetWithRange, apiPost, apiPut } from '@/api/client';
import { organizationManagementKeys } from '@/api/queryKeys';
import { useDeleteOrganization, useOnlineStatus } from '@/hooks';
import AuthorConversion from './index';
import { makeDocument, makeOrganization, person } from './fixtures';
import { makeJournal } from './api';
import { saveJournal } from './journal';

vi.mock('@/api/client', () => ({
  apiGet: vi.fn(),
  apiGetWithRange: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn()
}));
vi.mock('@/hooks', async importOriginal => ({
  ...(await importOriginal()),
  useOnlineStatus: vi.fn(),
  useDeleteOrganization: vi.fn()
}));
vi.mock('@/hooks/useNotification', () => ({
  useNotification: () => ({ onSuccess: vi.fn() })
}));

const onDeleted = vi.fn();
const deletion = vi.fn();
const onPreview = vi.fn();
let organization;
let documents;
let trash;
let isDeleted;
let people;

const renderSection = ({ deletedIds = new Set() } = {}) =>
  renderWithProviders(
    <MemoryRouter>
      <AuthorConversion
        isActive
        deletedIds={deletedIds}
        onPreview={onPreview}
        onDeleted={onDeleted}
      />
    </MemoryRouter>,
    { messages }
  );

const openDialog = async () => {
  const button = await screen.findByTestId('convert-organization-42');
  await waitFor(() => expect(button).toBeEnabled());
  fireEvent.click(button);
  return within(await screen.findByRole('dialog'));
};

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
  organization = makeOrganization({ authoredCount: 1 });
  documents = [makeDocument()];
  trash = [];
  people = [person];
  isDeleted = false;
  useOnlineStatus.mockReturnValue(true);
  useDeleteOrganization.mockReturnValue({ mutateAsync: deletion });
  deletion.mockImplementation(async () => {
    isDeleted = true;
  });
  apiGet.mockImplementation(async url => {
    if (url.includes('/organizations/'))
      return {
        ...organization,
        isDeleted,
        authoredCount: documents.filter(document =>
          document.authorsOrganization.some(
            author => String(author.id) === '42'
          )
        ).length
      };
    if (url.includes('/cavers/'))
      return people.find(candidate =>
        new URL(url).pathname.endsWith(`/${candidate.id}`)
      );
    return structuredClone(
      documents.find(document =>
        new URL(url).pathname.endsWith(`/${document.id}`)
      )
    );
  });
  apiGetWithRange.mockImplementation(async url => {
    const rows = url.includes('isDeleted=true') ? trash : [];
    return {
      data: { documents: rows },
      contentRange: rows.length
        ? `documents 0-${rows.length - 1}/${rows.length}`
        : null
    };
  });
  apiPost.mockImplementation(async (url, body) => {
    if (url.endsWith('/cavers')) {
      const created = {
        id: 55,
        nickname: `${body.name} ${body.surname}`,
        type: 'AUTHOR',
        authoredCount: 0
      };
      people.push(created);
      return created;
    }
    if (body.entities) return { results: people };
    if (body.entity === 'organizations')
      return { results: [organization], totalResults: 1 };
    const matches = body.filter['library.name']
      ? []
      : documents.filter(document =>
          document.authorsOrganization.some(
            author => String(author.id) === '42'
          )
        );
    return { results: structuredClone(matches), totalResults: matches.length };
  });
  apiPut.mockImplementation(async (_url, { document }) => {
    documents[0] = {
      ...documents[0],
      authors: document.authors.map(id => ({ id })),
      authorsOrganization: document.authorsOrganization.map(id => ({ id }))
    };
  });
});

it('filters Other organizations on the server and displays all four counters', async () => {
  organization.publishedCount = 4;
  organization.cavers = [{ id: 1 }, { id: 2 }];
  organization.exploredNetworks = [{ id: 1 }];
  renderSection();
  const row = await screen.findByTestId('organization-row-42');
  await waitFor(() => expect(within(row).getByText('4')).toBeVisible());
  expect(apiPost).toHaveBeenCalledWith(
    expect.stringContaining('/advanced-search'),
    expect.objectContaining({
      entity: 'organizations',
      filter: { type: ['OTHER'] }
    }),
    expect.anything()
  );
  expect(within(row).getByText('Authored documents')).toBeVisible();
  expect(within(row).getByText('Published documents')).toBeVisible();
  expect(within(row).getByText('Explored caves')).toBeVisible();
  expect(within(row).getByText('Members')).toBeVisible();
  expect(within(row).getByTestId('convert-organization-42')).toBeDisabled();
  expect(within(row).getByTestId('conversion-blockers')).toHaveTextContent(
    'Published documents: 4'
  );
});

it('shows the global Other total including blocked organizations and unloaded pages', async () => {
  organization.publishedCount = 4;
  const respond = apiPost.getMockImplementation();
  apiPost.mockImplementation((url, body) =>
    body.entity === 'organizations'
      ? Promise.resolve({ results: [organization], totalResults: 1234 })
      : respond(url, body)
  );
  renderSection();
  expect(
    await screen.findByTestId('other-organizations-total')
  ).toHaveTextContent('(1,234)');
  expect(screen.getAllByTestId(/^organization-row-/)).toHaveLength(1);
  expect(
    apiPost.mock.calls.filter(([, body]) => body.entity === 'organizations')
  ).toHaveLength(1);
});

it('does not subtract an archived organization again when the server total catches up', async () => {
  const other = makeOrganization({ id: 43, name: 'Another organization' });
  let hasCaughtUp = false;
  apiPost.mockImplementation(async () => ({
    results: hasCaughtUp ? [other] : [organization, other],
    totalResults: hasCaughtUp ? 1 : 2
  }));
  apiGet.mockResolvedValue(other);
  const { queryClient } = renderSection({ deletedIds: new Set(['42']) });
  expect(
    await screen.findByTestId('other-organizations-total')
  ).toHaveTextContent('(1)');
  hasCaughtUp = true;
  await act(async () => {
    await queryClient.refetchQueries({
      queryKey: organizationManagementKeys.other
    });
  });
  expect(screen.getByTestId('other-organizations-total')).toHaveTextContent(
    '(1)'
  );
});

it('keeps the existing organization preview action', async () => {
  renderSection();
  fireEvent.click(
    await screen.findByRole('button', { name: 'View organization Jean Dupont' })
  );
  expect(onPreview).toHaveBeenCalledWith(42);
});

it('blocks deleted documents from the shared check before opening a conversion', async () => {
  trash = [makeDocument({ isDeleted: true })];
  renderSection();
  expect(await screen.findByTestId('conversion-blockers')).toHaveTextContent(
    'Linked deleted documents: 1'
  );
  expect(screen.getByTestId('convert-organization-42')).toBeDisabled();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(apiPut).not.toHaveBeenCalled();
});

it('automatically searches the organization name but requires an explicit person choice and confirmation', async () => {
  renderSection();
  const dialog = await openDialog();
  expect(screen.getByTestId('other-organizations-total')).toHaveTextContent(
    '(1)'
  );
  const radio = await dialog.findByRole(
    'radio',
    { name: /Jean Dupont/ },
    { timeout: 10000 }
  );
  await waitFor(() => expect(radio).toBeEnabled());
  expect(radio).not.toBeChecked();
  expect(dialog.getByText(/Authored documents: 15/)).toBeVisible();
  expect(apiPost).toHaveBeenCalledWith(
    expect.stringContaining('/search'),
    expect.objectContaining({ entities: ['persons'], query: 'Jean Dupont' })
  );
  expect(dialog.getByTestId('conversion-confirm')).toBeDisabled();
  fireEvent.click(radio);
  expect(dialog.getByTestId('conversion-confirm')).toBeDisabled();
  fireEvent.click(dialog.getByRole('checkbox'));
  fireEvent.click(dialog.getByTestId('conversion-confirm'));
  await waitFor(() => expect(onDeleted).toHaveBeenCalledWith(42), {
    timeout: 10000
  });
  expect(apiPut).toHaveBeenCalledWith(
    expect.stringContaining('/101/new-entities'),
    {
      document: {
        authors: ['7', '8'],
        authorsOrganization: [],
        dateReviewed: expect.any(String)
      }
    }
  );
  expect(deletion).toHaveBeenCalledWith({ id: 42, isPermanent: false });
  expect(screen.getByTestId('other-organizations-total')).toHaveTextContent(
    '(0)'
  );
});

it.each([
  [33, 'Unknown', 149],
  [41378, 'Auteurs multiples', 42]
])(
  'transfers to the existing shortcut author #%i only after confirmation',
  async (id, nickname, authoredCount) => {
    const read = apiGet.getMockImplementation();
    apiGet.mockImplementation(url =>
      new URL(url).pathname.endsWith(`/cavers/${id}`)
        ? Promise.resolve({ id, nickname, authoredCount, type: 'AUTHOR' })
        : read(url)
    );
    renderSection();
    const dialog = await openDialog();
    fireEvent.click(dialog.getByTestId(`conversion-author-${id}`));
    const destination = await dialog.findByTestId('conversion-selected-author');
    expect(destination).toHaveTextContent('Selected author for the transfer');
    expect(destination).toHaveTextContent(nickname);
    expect(destination).toHaveTextContent(`#${id}`);
    expect(destination).toHaveTextContent(
      `Authored documents: ${authoredCount}`
    );
    expect(dialog.getByTestId(`conversion-author-${id}`)).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(
      dialog.getByTestId(`conversion-author-${id === 33 ? 41378 : 33}`)
    ).toHaveAttribute('aria-pressed', 'false');
    expect(dialog.getByTestId('conversion-confirm')).toBeDisabled();
    expect(apiPut).not.toHaveBeenCalled();
    expect(apiPost.mock.calls.some(([url]) => url.endsWith('/cavers'))).toBe(
      false
    );
    fireEvent.click(dialog.getByRole('checkbox'));
    fireEvent.click(dialog.getByTestId('conversion-confirm'));
    await waitFor(() => expect(onDeleted).toHaveBeenCalledWith(42));
    expect(apiPut.mock.calls[0][1].document.authors).toEqual(
      [String(id), '7'].sort()
    );
  }
);

it('clears the previous selection after a shortcut lookup fails and lets the moderator retry', async () => {
  const read = apiGet.getMockImplementation();
  let hasFailed = false;
  apiGet.mockImplementation(url => {
    if (!new URL(url).pathname.endsWith('/cavers/33')) return read(url);
    if (!hasFailed) {
      hasFailed = true;
      return Promise.reject(
        Object.assign(new Error('Internal'), { status: 500 })
      );
    }
    return Promise.resolve({
      id: 33,
      nickname: 'Unknown',
      type: 'AUTHOR',
      authoredCount: 149
    });
  });
  renderSection();
  const dialog = await openDialog();
  const radio = await dialog.findByRole('radio', { name: /Jean Dupont/ });
  await waitFor(() => expect(radio).toBeEnabled());
  fireEvent.click(radio);
  fireEvent.click(dialog.getByRole('checkbox'));
  expect(dialog.getByTestId('conversion-confirm')).toBeEnabled();
  fireEvent.click(dialog.getByTestId('conversion-author-33'));
  expect(await dialog.findByText('A server error occurred')).toBeVisible();
  expect(dialog.getByTestId('conversion-confirm')).toBeDisabled();
  expect(apiPut).not.toHaveBeenCalled();
  expect(deletion).not.toHaveBeenCalled();
  fireEvent.click(dialog.getByTestId('conversion-author-33'));
  expect(
    await dialog.findByTestId('conversion-selected-author')
  ).toHaveTextContent('Authored documents: 149');
  expect(dialog.queryByText('A server error occurred')).not.toBeInTheDocument();
});

it('creates an author separately, validates required names and keeps the final transfer manual', async () => {
  renderSection();
  const dialog = await openDialog();
  await waitFor(
    () => expect(dialog.getByTestId('conversion-new-author')).toBeEnabled(),
    { timeout: 10000 }
  );
  fireEvent.click(dialog.getByTestId('conversion-new-author'));
  expect(dialog.getByTestId('conversion-new-author')).toHaveTextContent(
    'New author'
  );
  expect(dialog.getByRole('textbox', { name: /^Last name/ })).toHaveValue(
    'DUPONT'
  );
  expect(dialog.getByRole('textbox', { name: /^First name/ })).toHaveValue(
    'Jean'
  );
  fireEvent.change(dialog.getByRole('textbox', { name: /^Last name/ }), {
    target: { value: '' }
  });
  fireEvent.change(dialog.getByRole('textbox', { name: /^First name/ }), {
    target: { value: '' }
  });
  fireEvent.click(dialog.getByTestId('conversion-create-author'));
  expect(await dialog.findAllByText('Required')).toHaveLength(2);
  expect(
    apiPost.mock.calls.filter(([url]) => url.endsWith('/cavers'))
  ).toHaveLength(0);
  fireEvent.change(dialog.getByRole('textbox', { name: /^Last name/ }), {
    target: { value: ' Dupont ' }
  });
  fireEvent.change(dialog.getByRole('textbox', { name: /^First name/ }), {
    target: { value: ' Jean ' }
  });
  fireEvent.click(dialog.getByTestId('conversion-create-author'));
  await waitFor(() =>
    expect(dialog.getByTestId('conversion-selected-author')).toHaveTextContent(
      'Authored documents: 0'
    )
  );
  expect(apiPost).toHaveBeenCalledWith(expect.stringContaining('/cavers'), {
    name: 'Jean',
    surname: 'Dupont'
  });
  expect(apiPut).not.toHaveBeenCalled();
  expect(deletion).not.toHaveBeenCalled();
  expect(dialog.queryByRole('radio')).not.toBeInTheDocument();
  expect(
    dialog.queryByTestId('conversion-person-search')
  ).not.toBeInTheDocument();
  expect(dialog.queryByTestId('conversion-new-author')).not.toBeInTheDocument();
  expect(dialog.getByTestId('conversion-confirm')).toBeDisabled();
  fireEvent.click(dialog.getByRole('checkbox'));
  fireEvent.click(dialog.getByTestId('conversion-confirm'));
  await waitFor(() => expect(onDeleted).toHaveBeenCalledWith(42));
  expect(apiPut.mock.calls[0][1].document.authors).toEqual(['55', '7']);
});

it('offers a saved conversion even when its source is no longer in the search results', async () => {
  saveJournal('moderator', makeJournal(organization, person, documents));
  apiPost.mockResolvedValue({ results: [], totalResults: 0 });
  renderSection();
  const resume = await screen.findByRole('button', {
    name: 'Resume conversion'
  });
  await waitFor(() => expect(resume).toBeEnabled());
  fireEvent.click(resume);
  expect(await screen.findByRole('dialog')).toHaveTextContent('Jean Dupont');
});

it('disables new conversions while offline', async () => {
  useOnlineStatus.mockReturnValue(false);
  renderSection();
  expect(await screen.findByTestId('convert-organization-42')).toBeDisabled();
});
