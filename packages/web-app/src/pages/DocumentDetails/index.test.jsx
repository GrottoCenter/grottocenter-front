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

// These previews/searches are unrelated to linked-card actions. Avoid loading
// PDF workers and the advanced search dependency tree in this focused test.
vi.mock('@/components/common/PdfPreview', () => ({ default: () => null }));
vi.mock('@/components/appli/SearchEntranceForm', () => ({
  default: () => null
}));
vi.mock('@/components/common/CustomIcon', () => ({ default: () => null }));

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

it('offers unlink actions for massifs and entrances, but not caves', () => {
  renderPage();
  expect(
    screen.getByRole('heading', { level: 1, name: 'Cave survey' })
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

it.each([false, true])(
  'shows the pending validation notice only when editing actions are shown (hidden: %s)',
  hideActions => {
    useDocument.mockReturnValue({
      data: { ...document, isValidated: false },
      isPending: false,
      refetch: vi.fn()
    });
    renderPage(hideActions);
    const notice = screen.queryByText(
      messages[
        'A moderator needs to validate the last modification before being able to edit the document again.'
      ]
    );
    if (hideActions) expect(notice).not.toBeInTheDocument();
    else expect(notice).toBeVisible();
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
