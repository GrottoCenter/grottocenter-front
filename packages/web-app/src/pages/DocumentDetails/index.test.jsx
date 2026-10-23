import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import {
  useDocument,
  usePermissions,
  useUnlinkDocumentToEntrance,
  useUnlinkDocumentToMassif
} from '@/hooks';
import { renderWithProviders } from '@/test/renderWithProviders';
import messages from '@/../public/lang/en.json';
import { getOrganizationIconSource } from '@/utils/organizationIcons';
import DocumentDetails from './index';

vi.mock('@/hooks', () => ({
  useDocument: vi.fn(),
  useDocumentChildren: () => ({ data: [], isPending: false }),
  useLanguages: () => ({ data: [], isPending: false }),
  useLicenses: () => ({ data: [] }),
  findLicenseByName: () => undefined,
  usePermissions: vi.fn(),
  useDeleteDocument: () => ({ mutate: vi.fn() }),
  useRestoreDocument: () => ({ mutate: vi.fn() }),
  useLinkDocumentToEntrances: () => ({ mutateAsync: vi.fn() }),
  useUnlinkDocumentToEntrance: vi.fn(),
  useUnlinkDocumentToMassif: vi.fn(),
  useSharePage: () => vi.fn(),
  useOnlineStatus: () => true,
  useIsDesktopLayout: () => true,
  useAnchorScroll: () => {},
  useDebounce: value => value,
  useQuickSearch: () => ({ data: { results: [] }, isFetching: false })
}));

// Keep source selection observable without loading PDF workers or making
// external requests. The search dependency tree is unrelated to these tests.
vi.mock('@/components/common/PdfPreview', () => ({
  default: ({ src }) => <div data-testid="pdf-preview" data-src={src} />
}));
vi.mock('@/components/appli/SearchEntranceForm', () => ({
  default: () => null
}));

// Importing the icon barrel opens thousands of modules on Windows. Keep the
// actual page, linked cards and confirmation dialog, with inert icon artwork.
vi.mock('@mui/icons-material', () => {
  const MockIcon = () => null;
  return {
    Article: MockIcon,
    ChevronLeft: MockIcon,
    ChevronRight: MockIcon,
    EventAvailable: MockIcon,
    Image: MockIcon,
    InsertDriveFile: MockIcon,
    NavigateNext: MockIcon,
    PictureAsPdf: MockIcon,
    TableChart: MockIcon,
    ZoomIn: MockIcon,
    ZoomOut: MockIcon
  };
});

// Raw document query data: the page must supply canUnlink and route callbacks.
// Sharing IDs across entity types catches accidental use of a foreign endpoint.
const document = {
  id: 123,
  title: 'Cave survey',
  type: 'Article',
  dateInscription: '2026-01-01T00:00:00Z',
  isValidated: true,
  isDeleted: false,
  authors: [],
  authorsOrganization: [],
  massifs: [{ id: 7, name: 'Vercors' }],
  cave: { id: 7, name: 'Survey network' },
  entrances: [{ id: 7, name: 'Survey entrance' }]
};

const renderPage = (hideActions = false, isPreview = false) =>
  renderWithProviders(
    <MemoryRouter initialEntries={['/ui/documents/123']}>
      <Routes>
        <Route
          path="/ui/documents/:documentId"
          element={
            <DocumentDetails hideActions={hideActions} isPreview={isPreview} />
          }
        />
      </Routes>
    </MemoryRouter>,
    { messages }
  );

beforeEach(() => {
  vi.clearAllMocks();
  useDocument.mockReturnValue({
    data: document,
    isPending: false,
    isPaused: false,
    error: null,
    refetch: vi.fn()
  });
  usePermissions.mockReturnValue({ isAuth: true, isModerator: true });
  useUnlinkDocumentToEntrance.mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false
  });
  useUnlinkDocumentToMassif.mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false
  });
});

it.each(['EDITION', 'SPELEOLOGY', null, undefined, 'FUTURE'])(
  'uses the editor organization type %s for its icon and keeps its link',
  type => {
    useDocument.mockReturnValue({
      data: {
        ...document,
        editor: { id: 42, name: 'Document publisher', type }
      },
      isPending: false,
      refetch: vi.fn()
    });
    renderPage();
    const link = screen.getByRole('link', { name: 'Document publisher' });
    expect(link).toHaveAttribute('href', '/ui/organizations/42');
    const icon = link.parentElement.querySelector('img');
    expect(icon).toHaveAttribute('src', getOrganizationIconSource(type));
    expect(icon).toHaveAttribute('alt', '');
  }
);

describe('external PDF fallback', () => {
  const ownUrl = 'https://example.org/article.pdf';
  const parentUrl = 'https://example.org/issue.pdf?download=1';
  const parent = {
    id: 456,
    type: 'Issue',
    title: 'Parent issue',
    identifier: parentUrl,
    identifierType: 'url'
  };

  it.each([
    ['parent URL identifier', { parent }, parentUrl],
    [
      'parent URL at the article page',
      { parent, pages: '12-18' },
      `${parentUrl}#page=12`
    ],
    [
      'first article range',
      { parent, pages: '12-18, 24-26' },
      `${parentUrl}#page=12`
    ],
    ['single article page', { parent, pages: '12' }, `${parentUrl}#page=12`],
    ['invalid article pages', { parent, pages: 'iv, 0, 18-12' }, parentUrl],
    [
      'parent URL with an existing destination',
      {
        parent: { ...parent, identifier: `${parentUrl}#page=4&zoom=125` },
        pages: '12-18'
      },
      `${parentUrl}#page=12&zoom=125`
    ],
    [
      'parent description at the article page',
      { parent: { id: 456, description: parentUrl }, pages: '12-18' },
      `${parentUrl}#page=12`
    ],
    [
      'parent description without the new API fields',
      { parent: { id: 456, description: `Read ${parentUrl}.` } },
      parentUrl
    ],
    [
      'document URL before parent URL',
      { parent, identifier: ownUrl, identifierType: 'url', pages: '12-18' },
      ownUrl
    ],
    [
      'document description before parent URL',
      { parent, description: `Read ${ownUrl}.`, pages: '12-18' },
      ownUrl
    ],
    [
      'parent description after a non-PDF identifier',
      {
        parent: {
          ...parent,
          identifier: 'https://example.org/catalogue',
          description: parentUrl
        }
      },
      parentUrl
    ]
  ])('uses the %s', (_label, data, expectedUrl) => {
    useDocument.mockReturnValue({ data: { ...document, ...data } });
    renderPage();

    expect(screen.getByTestId('pdf-preview')).toHaveAttribute(
      'data-src',
      expectedUrl
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      messages[
        'This PDF is displayed from an external website. Grottocenter does not host it and claims no rights over it.'
      ]
    );
  });

  it.each([
    ['no parent', {}],
    ['missing parent identifier fields', { parent: { id: 456 } }],
    [
      'non-URL parent identifier',
      { parent: { ...parent, identifierType: 'doi' } }
    ]
  ])('renders no external preview with %s', (_label, data) => {
    useDocument.mockReturnValue({ data: { ...document, ...data } });
    renderPage();

    expect(screen.queryByTestId('pdf-preview')).not.toBeInTheDocument();
    expect(
      screen.getByText('No files attached to this document.')
    ).toBeVisible();
  });

  it.each([
    [
      'document attachment',
      { files: [{ fileName: 'article.pdf', completePath: ownUrl }] },
      ownUrl
    ],
    [
      'parent attachment with article pages',
      {
        pages: '12-18',
        parent: {
          ...parent,
          files: [{ fileName: 'issue.pdf', completePath: parentUrl }]
        }
      },
      `${parentUrl}#page=12`
    ]
  ])('keeps the %s ahead of external links', (_label, data, expectedUrl) => {
    useDocument.mockReturnValue({ data: { ...document, parent, ...data } });
    renderPage();

    expect(screen.getByTestId('pdf-preview')).toHaveAttribute(
      'data-src',
      expectedUrl
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

it('offers unlink actions for massifs and entrances, but not caves', () => {
  renderPage();
  expect(
    screen.getByRole('heading', { level: 1, name: /Cave survey$/ })
  ).toBeVisible();

  expect(screen.getByRole('link', { name: /Survey network/ })).toHaveAttribute(
    'href',
    '/ui/caves/7'
  );
  expect(
    screen.queryByRole('button', { name: 'unlink Survey network' })
  ).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'unlink Vercors' })).toBeEnabled();
  expect(
    screen.getByRole('button', { name: 'unlink Survey entrance' })
  ).toBeEnabled();
  expect(screen.getAllByRole('button', { name: /^unlink / })).toHaveLength(2);
});

it('renders the document title as a smaller heading when embedded in the moderation result', () => {
  renderPage(false, true);
  expect(
    screen.getByRole('heading', { level: 3, name: 'Cave survey' })
  ).toBeVisible();
  expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: /^unlink / })
  ).not.toBeInTheDocument();
});

it.each([
  [
    'Vercors',
    useUnlinkDocumentToMassif,
    useUnlinkDocumentToEntrance,
    'massifId'
  ],
  [
    'Survey entrance',
    useUnlinkDocumentToEntrance,
    useUnlinkDocumentToMassif,
    'entranceId'
  ]
])(
  'unlinks %s through its own mutation after confirmation',
  async (name, expectedHook, otherHook, idKey) => {
    const user = userEvent.setup();
    const expectedMutation = expectedHook().mutateAsync;
    const otherMutation = otherHook().mutateAsync;
    renderPage();

    await user.click(screen.getByRole('button', { name: `unlink ${name}` }));
    const dialog = screen.getByRole('dialog', { name: 'Unlink' });
    expect(dialog).toHaveTextContent(
      `Are you sure you want to unlink ${name}?`
    );
    expect(expectedMutation).not.toHaveBeenCalled();
    expect(otherMutation).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole('button', { name: 'Unlink' }));

    expect(expectedMutation).toHaveBeenCalledExactlyOnceWith({
      [idKey]: 7,
      documentId: document.id
    });
    expect(otherMutation).not.toHaveBeenCalled();
  }
);

it.each([
  [null, 'This document is awaiting validation by a moderator.'],
  [
    { id: 9, nickname: 'Moderator' },
    messages[
      'A moderator needs to validate the last modification before being able to edit the document again.'
    ]
  ]
])(
  'shows the pending notice for the submission kind (%j)',
  (validator, text) => {
    useDocument.mockReturnValue({
      data: {
        ...document,
        isValidated: false,
        dateValidation: null,
        validator
      },
      isPending: false,
      refetch: vi.fn()
    });
    renderPage();
    expect(screen.getByRole('alert')).toHaveTextContent(text);
    expect(
      screen.queryByText('This document has been rejected.')
    ).not.toBeInTheDocument();
  }
);

it('shows the refusal, plain-text reason and localized decision date', () => {
  useDocument.mockReturnValue({
    data: {
      ...document,
      isValidated: false,
      dateValidation: '2026-10-18T12:00:00Z',
      validatorComment: '<b>Wrong entrance</b>\nPlease check the location.'
    },
    isPending: false,
    refetch: vi.fn()
  });
  renderPage();
  const notice = screen.getByRole('alert');
  expect(notice).toHaveTextContent('This document has been rejected.');
  expect(notice).toHaveTextContent('Reason: <b>Wrong entrance</b>');
  expect(notice).toHaveTextContent('Decision on October 18, 2026');
  expect(notice.querySelector('b')).toBeNull();
  expect(notice).not.toHaveTextContent('awaiting validation');
  expect(notice).not.toHaveTextContent('A moderator needs to validate');
});

it('shows a refusal without an empty reason when no comment is available', () => {
  useDocument.mockReturnValue({
    data: {
      ...document,
      isValidated: false,
      dateValidation: '2026-10-18T12:00:00Z',
      validatorComment: '   '
    },
    isPending: false,
    refetch: vi.fn()
  });
  renderPage();
  expect(screen.getByRole('alert')).toHaveTextContent(
    'This document has been rejected.'
  );
  expect(screen.getByRole('alert')).not.toHaveTextContent('Reason:');
});

it.each([
  [
    'accepted version after a refused modification',
    {
      isValidated: true,
      dateValidation: '2026-10-18T12:00:00Z',
      validatorComment: 'No'
    }
  ],
  ['missing decision date', { isValidated: false }],
  ['invalid decision date', { isValidated: false, dateValidation: 'invalid' }],
  ['missing validation flag', { isValidated: undefined, dateValidation: null }],
  [
    'deleted document',
    { isValidated: false, dateValidation: null, isDeleted: true }
  ]
])('does not invent a pending or refused state for %s', (_label, state) => {
  useDocument.mockReturnValue({
    data: { ...document, ...state },
    isPending: false,
    refetch: vi.fn()
  });
  renderPage();
  expect(
    screen.queryByTestId('document-moderation-notice')
  ).not.toBeInTheDocument();
  expect(
    screen.queryByText(/A moderator needs to validate/)
  ).not.toBeInTheDocument();
});

it.each([null, '2026-10-18T12:00:00Z'])(
  'hides the moderation notice when actions are hidden (decision: %s)',
  dateValidation => {
    useDocument.mockReturnValue({
      data: { ...document, isValidated: false, dateValidation },
      isPending: false,
      refetch: vi.fn()
    });
    renderPage(true);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  }
);

it.each([null, '2026-10-18T12:00:00Z'])(
  'hides the moderation notice for anonymous readers (decision: %s)',
  dateValidation => {
    usePermissions.mockReturnValue({ isAuth: false, isModerator: false });
    useDocument.mockReturnValue({
      data: { ...document, isValidated: false, dateValidation },
      isPending: false,
      refetch: vi.fn()
    });
    renderPage();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  }
);

it.each([true, false])(
  'hides all unlink actions for a non-moderator (authenticated: %s)',
  isAuth => {
    usePermissions.mockReturnValue({ isAuth, isModerator: false });
    renderPage();

    expect(screen.getByRole('link', { name: /Vercors/ })).toBeVisible();
    expect(screen.getByRole('link', { name: /Survey network/ })).toBeVisible();
    expect(screen.getByRole('link', { name: /Survey entrance/ })).toBeVisible();
    expect(
      screen.queryByRole('button', { name: /^unlink / })
    ).not.toBeInTheDocument();
    expect(useUnlinkDocumentToEntrance().mutateAsync).not.toHaveBeenCalled();
    expect(useUnlinkDocumentToMassif().mutateAsync).not.toHaveBeenCalled();
  }
);
