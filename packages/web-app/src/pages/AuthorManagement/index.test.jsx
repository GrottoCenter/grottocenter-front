import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { apiGet, apiPost, apiDelete } from '@/api/client';
import {
  usePermissions,
  useOnlineStatus,
  useAuthorDuplicateScan,
  useDeletePerson
} from '@/hooks';
import { useAuthorDuplicateScan as useRealScan } from '@/hooks/queries/useAuthorDuplicateScan';
import { useDeletePerson as useRealDeletePerson } from '@/hooks/mutations/usePerson';
import { analyzePersonDuplicates } from '@/utils/analyzePersonDuplicates';
import { findPersonDuplicates } from '@/utils/personDuplicates';
import { renderWithProviders } from '@/test/renderWithProviders';
import DocumentsList from '@/components/common/DocumentsList/DocumentsList';
import messages from '@/../public/lang/en.json';
import japaneseMessages from '@/../public/lang/ja.json';
import AuthorManagement from './index';

vi.mock('@/api/client', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiDelete: vi.fn()
}));
vi.mock('@/utils/analyzePersonDuplicates', () => ({
  analyzePersonDuplicates: vi.fn()
}));
// Bibliographic rendering has its own tests; this page exercises selection and
// mutations without loading the document media viewers into JSDOM.
vi.mock(
  '@/components/common/DocumentsList/OrganizationDocumentReferences',
  () => ({
    default: () => null,
    DocumentReferencesSubheader: () => null
  })
);
vi.mock('@/components/common/DocumentsList/DocumentsList', () => ({
  default: vi.fn(() => null)
}));
vi.mock('@/hooks', () => ({
  usePermissions: vi.fn(),
  useOnlineStatus: vi.fn(),
  useAuthorDuplicateScan: vi.fn(),
  useDeletePerson: vi.fn()
}));

const people = [
  {
    id: '101',
    name: 'Marie',
    surname: 'Dupont',
    nickname: 'Marie Dupont',
    type: 'AUTHOR',
    authoredCount: 25
  },
  {
    id: '102',
    name: 'Marie',
    surname: 'Dupont',
    nickname: 'Marie D.',
    type: 'CAVER',
    authoredCount: 3
  }
];
const getRequestedId = url =>
  new URL(url, 'https://example.org').pathname.split('/').pop();
const renderManagement = (intlOptions = {}) =>
  renderWithProviders(
    <MemoryRouter initialEntries={['/ui/persons/management']}>
      <Routes>
        <Route path="/ui/persons/management" element={<AuthorManagement />} />
        <Route path="/ui/dashboard" element={<p>Dashboard</p>} />
      </Routes>
    </MemoryRouter>,
    { messages, ...intlOptions }
  );
const analyze = async () => {
  fireEvent.click(screen.getByRole('button', { name: 'Analyze' }));
  return screen.findByTestId('author-pair-101:102');
};
const compare = async () => {
  const pair = await analyze();
  fireEvent.click(within(pair).getByRole('button', { name: 'Compare' }));
  await waitFor(() => expect(apiGet).toHaveBeenCalledTimes(2));
  await waitFor(() =>
    expect(
      within(screen.getByTestId('author-comparison-101')).getByTestId(
        'author-document-count'
      )
    ).toHaveTextContent('25')
  );
  return pair;
};
const openConfirmation = async pair => {
  fireEvent.click(
    within(pair).getByRole('button', {
      name: messages['authorDuplicates.merge']
    })
  );
  return screen.findByRole('dialog');
};

beforeEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
  usePermissions.mockReturnValue({ isAuth: true, isModerator: true });
  useOnlineStatus.mockReturnValue(true);
  useAuthorDuplicateScan.mockImplementation(useRealScan);
  useDeletePerson.mockImplementation(useRealDeletePerson);
  apiPost.mockResolvedValue({ results: people, totalResults: 2 });
  apiGet.mockImplementation(url =>
    Promise.resolve(
      people.find(person => String(person.id) === getRequestedId(url))
    )
  );
  apiDelete.mockResolvedValue(people[0]);
  analyzePersonDuplicates.mockImplementation(async persons =>
    findPersonDuplicates(persons)
  );
});

it('loads no catalog on arrival and shows no tabs', async () => {
  renderManagement();
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
    'Manage authors'
  );
  expect(screen.queryByRole('tablist')).toBeNull();
  expect(apiPost).not.toHaveBeenCalled();
  expect(apiGet).not.toHaveBeenCalled();
  await analyze();
  expect(apiPost).toHaveBeenCalledWith(
    expect.stringContaining('/advanced-search'),
    expect.objectContaining({
      entity: 'persons',
      filter: {},
      size: 1000,
      page: 1
    }),
    expect.objectContaining({ signal: expect.any(AbortSignal) })
  );
  expect(apiGet).not.toHaveBeenCalled();
});

it('blocks unauthorized users before mounting any queries', async () => {
  usePermissions.mockReturnValue({ isAuth: true, isModerator: false });
  renderManagement();
  expect(await screen.findByText('Dashboard')).toBeVisible();
  expect(apiPost).not.toHaveBeenCalled();
});

it('reports a page eleven rejection without showing partial matches and allows retrying', async () => {
  apiPost.mockImplementation((_url, { page }) => {
    if (page === 11) {
      return Promise.reject(
        Object.assign(new Error('Search result window exceeded'), {
          status: 400,
          body: { message: 'Search result window exceeded' }
        })
      );
    }
    return Promise.resolve({
      results: Array.from({ length: 1000 }, (_, index) => ({
        ...people[0],
        id: String((page - 1) * 1000 + index + 1)
      })),
      totalResults: 11000
    });
  });
  renderManagement();
  fireEvent.click(screen.getByRole('button', { name: 'Analyze' }));
  expect(
    await screen.findByText('Search result window exceeded')
  ).toBeVisible();
  expect(apiPost).toHaveBeenCalledTimes(11);
  expect(analyzePersonDuplicates).not.toHaveBeenCalled();
  expect(screen.queryByTestId('author-pair-101:102')).toBeNull();
  expect(screen.queryByText(/scanned ·/)).toBeNull();
  expect(screen.getByRole('button', { name: 'Analyze' })).toBeEnabled();
  apiPost.mockResolvedValue({ results: people, totalResults: 2 });
  await analyze();
  expect(screen.queryByText('Search result window exceeded')).toBeNull();
});

it('previews only the selected profile documents without an ambiguous search link', async () => {
  const documents = [{ id: 201, title: 'Selected author document' }];
  apiGet.mockImplementation(url =>
    Promise.resolve({
      ...people.find(person => String(person.id) === getRequestedId(url)),
      documents
    })
  );
  renderManagement();
  await compare();
  fireEvent.click(
    screen.getByRole('button', { name: 'Preview — Marie Dupont (#101)' })
  );
  const dialog = await screen.findByRole('dialog');
  expect(
    within(dialog).getByRole('heading', { name: 'Documents (25)' })
  ).toBeVisible();
  expect(DocumentsList).toHaveBeenCalledWith(
    expect.objectContaining({ documents, showSort: false }),
    undefined
  );
  expect(
    within(dialog).queryByRole('link', { name: 'See all documents' })
  ).toBeNull();
});

it('loads details on comparison, uses the real document count and fixes a caver destination', async () => {
  renderManagement();
  const pair = await compare();
  expect(
    within(screen.getByTestId('author-comparison-101')).getByTestId(
      'author-document-count'
    )
  ).toHaveTextContent('25');
  expect(
    within(screen.getByTestId('author-comparison-102')).getByRole('status')
  ).toHaveTextContent('To keep');
  expect(within(pair).queryByRole('button', { name: 'Keep' })).toBeNull();
  expect(within(pair).queryByRole('combobox')).toBeNull();
  expect(apiPost).toHaveBeenCalledTimes(1);
  expect(
    within(pair).getAllByRole('link', { name: /^Open profile/ })[0]
  ).toHaveAttribute('target', '_blank');
  const source = within(screen.getByTestId('author-comparison-101'));
  const target = within(screen.getByTestId('author-comparison-102'));
  const heading = source.getByRole('heading', { level: 3 });
  expect(heading.querySelector('strong')).toHaveTextContent('Marie Dupont');
  expect(heading).toHaveTextContent('Marie Dupont #101');
  expect(within(heading).getByRole('img', { name: 'Author' })).toBeVisible();
  expect(source.queryByTestId('comparison-field-type')).toBeNull();
  expect(
    source.getByTestId('author-document-count').querySelector('strong')
  ).toHaveTextContent('25');
  expect(
    source.getByTestId('comparison-field-name').querySelector('strong')
  ).toBeNull();
  expect(target.getByRole('status')).toContainElement(
    target.getByTestId('CheckIcon')
  );
  expect(
    source.getByRole('button', { name: messages['authorDuplicates.merge'] })
  ).toBeVisible();
  expect(
    target.queryByRole('button', { name: messages['authorDuplicates.merge'] })
  ).toBeNull();
  expect(source.getByRole('button', { name: /^Preview/ })).toHaveClass(
    'MuiIconButton-root'
  );
  expect(source.queryByRole('link', { name: /^Edit properties/ })).toBeNull();
  expect(within(pair).getByRole('button', { name: 'Close' })).toContainElement(
    within(pair).getByTestId('CloseIcon')
  );
  expect(within(pair).getByRole('button', { name: 'Ignore' })).toContainElement(
    within(pair).getByTestId('DoNotDisturbIcon')
  );
});

it('offers the existing edit route to administrators in the shared action bar', async () => {
  usePermissions.mockReturnValue({
    isAuth: true,
    isModerator: true,
    isAdmin: true
  });
  renderManagement();
  await compare();
  const source = within(screen.getByTestId('author-comparison-101'));
  const edit = source.getByRole('link', { name: /^Edit properties/ });
  expect(edit).toHaveAttribute('href', '/ui/persons/101/edit');
  expect(edit).toHaveAttribute('target', '_blank');
  expect(edit).toContainElement(source.getByTestId('EditIcon'));
  expect(source.getByRole('link', { name: /^Open profile/ })).toContainElement(
    source.getByTestId('OpenInNewIcon')
  );
});

it('allows retrying a failed detail read from the shared panel', async () => {
  apiGet.mockRejectedValueOnce({ status: 500 });
  renderManagement();
  const pair = await analyze();
  fireEvent.click(within(pair).getByRole('button', { name: 'Compare' }));
  const source = within(screen.getByTestId('author-comparison-101'));
  const retry = await source.findByRole('button', { name: 'Retry' });
  expect(retry).toBeEnabled();
  expect(
    source.getByRole('button', { name: messages['authorDuplicates.merge'] })
  ).toBeDisabled();
  fireEvent.click(retry);
  await waitFor(() =>
    expect(source.getByTestId('author-document-count')).toHaveTextContent('25')
  );
  expect(
    source.getByRole('button', { name: messages['authorDuplicates.merge'] })
  ).toBeEnabled();
});

it('rereads both people, sends one author-to-caver delete and keeps a success link', async () => {
  renderManagement();
  const pair = await compare();
  const dialog = await openConfirmation(pair);
  expect(dialog).toHaveTextContent('permanently deleted');
  expect(apiDelete).not.toHaveBeenCalled();
  const confirm = within(dialog).getByRole('button', {
    name: messages['authorDuplicates.merge']
  });
  fireEvent.click(confirm);
  fireEvent.click(confirm);
  expect(await screen.findByTestId('author-merge-success-101')).toBeVisible();
  expect(apiDelete).toHaveBeenCalledTimes(1);
  expect(apiDelete).toHaveBeenCalledWith(
    expect.stringMatching(/\/cavers\/101\?entityId=102$/)
  );
  expect(
    apiGet.mock.calls.filter(([url]) => getRequestedId(url) === '101')
  ).toHaveLength(2);
  expect(screen.queryByTestId('author-pair-101:102')).toBeNull();
  expect(
    within(screen.getByTestId('author-merge-success-101')).getByRole('link')
  ).toHaveAttribute('href', '/ui/persons/102');
});

it('places the destination link inside the translated Japanese success sentence', async () => {
  renderManagement({ locale: 'ja', messages: japaneseMessages });
  fireEvent.click(
    screen.getByRole('button', {
      name: japaneseMessages['duplicates.analyze']
    })
  );
  const pair = await screen.findByTestId('author-pair-101:102');
  fireEvent.click(
    within(pair).getByRole('button', {
      name: japaneseMessages['duplicates.compare']
    })
  );
  const mergeLabel = japaneseMessages['authorDuplicates.merge'];
  await waitFor(() =>
    expect(within(pair).getByRole('button', { name: mergeLabel })).toBeEnabled()
  );
  fireEvent.click(within(pair).getByRole('button', { name: mergeLabel }));
  const dialog = await screen.findByRole('dialog');
  fireEvent.click(within(dialog).getByRole('button', { name: mergeLabel }));
  const receipt = await screen.findByTestId('author-merge-success-101');
  const link = within(receipt).getByRole('link');
  expect(link).toHaveAttribute('href', '/ui/persons/102');
  expect(link.parentElement).toHaveTextContent(
    '著者 Marie Dupont (#101) は削除され、参照は Marie D. (#102) に移されました。'
  );
});

it('lets the moderator choose which of two authors to keep', async () => {
  apiPost.mockResolvedValue({
    results: people.map(person => ({ ...person, type: 'AUTHOR' })),
    totalResults: 2
  });
  apiGet.mockImplementation(url =>
    Promise.resolve({
      ...people.find(person => String(person.id) === getRequestedId(url)),
      type: 'AUTHOR'
    })
  );
  renderManagement();
  const pair = await compare();
  expect(
    within(pair).queryByRole('button', {
      name: messages['authorDuplicates.merge']
    })
  ).toBeNull();
  fireEvent.click(
    within(screen.getByTestId('author-comparison-101')).getByRole('button', {
      name: 'Keep'
    })
  );
  const dialog = await openConfirmation(pair);
  fireEvent.click(
    within(dialog).getByRole('button', {
      name: messages['authorDuplicates.merge']
    })
  );
  await waitFor(() =>
    expect(apiDelete).toHaveBeenCalledWith(
      expect.stringMatching(/\/cavers\/102\?entityId=101$/)
    )
  );
});

it.each([
  [33, 'authorDuplicates.unknownAuthor'],
  ['41378', 'authorDuplicates.multipleAuthors']
])(
  'keeps protected author #%s as the fixed destination',
  async (id, labelId) => {
    const protectedAuthor = { ...people[0], id };
    const all = [protectedAuthor, people[0]];
    apiPost.mockResolvedValue({ results: all, totalResults: all.length });
    apiGet.mockImplementation(url =>
      Promise.resolve(
        all.find(person => String(person.id) === getRequestedId(url))
      )
    );
    renderManagement();
    fireEvent.click(screen.getByRole('button', { name: 'Analyze' }));
    const key = all
      .map(person => Number(person.id))
      .sort((a, b) => a - b)
      .join(':');
    const pair = await screen.findByTestId(`author-pair-${key}`);
    expect(within(pair).getByText(messages[labelId])).toHaveClass(
      'MuiChip-label'
    );
    fireEvent.click(within(pair).getByRole('button', { name: 'Compare' }));
    const target = within(screen.getByTestId(`author-comparison-${id}`));
    expect(target.getByText(messages[labelId])).toBeVisible();
    expect(target.getByRole('status')).toHaveTextContent('To keep');
    expect(within(pair).queryByRole('button', { name: 'Keep' })).toBeNull();
    expect(
      target.queryByRole('button', { name: messages['authorDuplicates.merge'] })
    ).toBeNull();
    const merge = within(pair).getByRole('button', {
      name: messages['authorDuplicates.merge']
    });
    await waitFor(() => expect(merge).toBeEnabled());
    const dialog = await openConfirmation(pair);
    fireEvent.click(
      within(dialog).getByRole('button', {
        name: messages['authorDuplicates.merge']
      })
    );
    await waitFor(() =>
      expect(apiDelete).toHaveBeenCalledWith(
        expect.stringMatching(new RegExp(`/cavers/101\\?entityId=${id}$`))
      )
    );
  }
);

it('refuses a source that has become a caver since the scan', async () => {
  renderManagement();
  const pair = await compare();
  const dialog = await openConfirmation(pair);
  apiGet.mockImplementation(url =>
    Promise.resolve({
      ...people.find(person => String(person.id) === getRequestedId(url)),
      type: 'CAVER'
    })
  );
  fireEvent.click(
    within(dialog).getByRole('button', {
      name: messages['authorDuplicates.merge']
    })
  );
  expect(
    await within(dialog).findByText(messages['authorDuplicates.changed'])
  ).toBeVisible();
  expect(apiDelete).not.toHaveBeenCalled();
});

it('keeps the destination after a mutation error and rereads on retry', async () => {
  apiDelete.mockRejectedValueOnce({ status: 500 });
  renderManagement();
  const dialog = await openConfirmation(await compare());
  fireEvent.click(
    within(dialog).getByRole('button', {
      name: messages['authorDuplicates.merge']
    })
  );
  expect(
    await within(dialog).findByText(messages['A server error occurred'])
  ).toBeVisible();
  fireEvent.click(
    within(dialog).getByRole('button', {
      name: messages['authorDuplicates.merge']
    })
  );
  expect(await screen.findByTestId('author-merge-success-101')).toBeVisible();
  expect(apiDelete).toHaveBeenCalledTimes(2);
});

it('persists ignored pairs and lets the moderator restore them', async () => {
  const { unmount } = renderManagement();
  const pair = await analyze();
  fireEvent.click(within(pair).getByRole('button', { name: 'Ignore' }));
  expect(localStorage.getItem('authorManagement.ignoredDuplicates.v1')).toBe(
    '101:102'
  );
  unmount();
  renderManagement();
  fireEvent.click(screen.getByRole('button', { name: 'Analyze' }));
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Show ignored' })).toBeEnabled()
  );
  expect(screen.queryByTestId('author-pair-101:102')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Show ignored' }));
  expect(screen.getByTestId('author-pair-101:102')).toBeVisible();
});

it('never shows partial matches after cancelling and can restart', async () => {
  let signal;
  apiPost.mockImplementation((_url, _body, options) => {
    signal = options.signal;
    return new Promise(() => {});
  });
  renderManagement();
  fireEvent.click(screen.getByRole('button', { name: 'Analyze' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }));
  await waitFor(() => expect(signal.aborted).toBe(true));
  expect(
    await screen.findByText(messages['duplicates.cancelledScan'])
  ).toBeVisible();
  expect(analyzePersonDuplicates).not.toHaveBeenCalled();
  apiPost.mockResolvedValue({ results: people, totalResults: 2 });
  await analyze();
});

it('removes every suggestion containing the deleted author while retaining unrelated comparisons', async () => {
  const all = [
    ...people,
    { ...people[0], id: '103' },
    {
      ...people[0],
      id: '104',
      name: 'Jean',
      surname: 'Martin',
      nickname: 'Jean Martin'
    },
    {
      ...people[0],
      id: '105',
      name: 'Jean',
      surname: 'Martin',
      nickname: 'J. Martin'
    }
  ];
  apiPost.mockResolvedValue({ results: all, totalResults: all.length });
  apiGet.mockImplementation(url =>
    Promise.resolve(
      all.find(person => String(person.id) === getRequestedId(url))
    )
  );
  renderManagement();
  const pair = await compare();
  const unrelated = screen.getByTestId('author-pair-104:105');
  fireEvent.click(within(unrelated).getByRole('button', { name: 'Compare' }));
  const dialog = await openConfirmation(pair);
  expect(
    screen.getByRole('button', { name: 'Analyze', hidden: true })
  ).toBeDisabled();
  fireEvent.click(
    within(dialog).getByRole('button', {
      name: messages['authorDuplicates.merge']
    })
  );
  expect(await screen.findByTestId('author-merge-success-101')).toBeVisible();
  expect(screen.queryByTestId('author-pair-101:103')).toBeNull();
  expect(screen.getByTestId('author-pair-102:103')).toBeVisible();
  expect(
    within(unrelated).getByRole('button', { name: 'Close' })
  ).toBeVisible();
});

it('keeps the merge receipt in place among homonyms until acknowledged and refreshes the survivor', async () => {
  const all = [33, 37330, 37331].map(id => ({
    id,
    type: 'AUTHOR',
    name: 'Unknown',
    surname: 'Unknown',
    nickname: 'Unknown',
    authoredCount: id === 33 ? 152 : 123
  }));
  let hasMerged = false;
  apiPost.mockResolvedValue({ results: all, totalResults: all.length });
  apiGet.mockImplementation(url => {
    const person = all.find(
      candidate => String(candidate.id) === getRequestedId(url)
    );
    return Promise.resolve(
      hasMerged && person.id === 33 ? { ...person, authoredCount: 275 } : person
    );
  });
  apiDelete.mockImplementation(async () => {
    hasMerged = true;
    return null; // The API can acknowledge permanent deletion with HTTP 204.
  });
  renderManagement();
  fireEvent.click(screen.getByRole('button', { name: 'Analyze' }));
  const pair = await screen.findByTestId('author-pair-33:37330');
  const nextPair = screen.getByTestId('author-pair-33:37331');
  fireEvent.click(within(pair).getByRole('button', { name: 'Compare' }));
  fireEvent.click(within(nextPair).getByRole('button', { name: 'Compare' }));
  await waitFor(() =>
    expect(
      within(pair).getByRole('button', {
        name: messages['authorDuplicates.merge']
      })
    ).toBeEnabled()
  );
  const dialog = await openConfirmation(pair);
  fireEvent.click(
    within(dialog).getByRole('button', {
      name: messages['authorDuplicates.merge']
    })
  );
  const receipt = await screen.findByTestId('author-merge-success-37330');
  expect(receipt).toHaveTextContent('Unknown (#37330)');
  expect(within(receipt).getByRole('link')).toHaveTextContent('Unknown (#33)');
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(screen.queryByTestId('author-pair-33:37330')).toBeNull();
  expect(screen.queryByTestId('author-pair-37330:37331')).toBeNull();
  expect(receipt.nextElementSibling).toBe(nextPair);
  expect(within(nextPair).getByRole('button', { name: 'Close' })).toBeVisible();
  expect(
    within(receipt).queryByRole('button', {
      name: messages['authorDuplicates.merge']
    })
  ).toBeNull();
  await waitFor(() =>
    expect(
      within(nextPair).getAllByTestId('author-document-count')[0]
    ).toHaveTextContent('275')
  );
  const acknowledge = within(receipt).getByRole('button', { name: 'Got it' });
  expect(acknowledge).toHaveFocus();
  fireEvent.click(acknowledge);
  expect(screen.queryByTestId('author-merge-success-37330')).toBeNull();
  expect(nextPair).toBeVisible();
  // An unchanged search index must not reintroduce the deleted author on rescan.
  fireEvent.click(screen.getByRole('button', { name: 'Analyze' }));
  expect(await screen.findByTestId('author-pair-33:37331')).toBeVisible();
  expect(screen.queryByTestId('author-pair-33:37330')).toBeNull();
  expect(apiDelete).toHaveBeenCalledTimes(1);
});

it('disables analysis while offline', () => {
  useOnlineStatus.mockReturnValue(false);
  renderManagement();
  expect(screen.getByRole('button', { name: 'Analyze' })).toBeDisabled();
  expect(apiPost).not.toHaveBeenCalled();
});
