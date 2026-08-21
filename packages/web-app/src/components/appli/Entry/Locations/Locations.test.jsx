import { render, screen, fireEvent, act } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import Locations from './index';

// The reorder mutation used to be a Redux thunk; now it's a React Query
// mutation hook. Mock it as a mutation-shaped object so the component
// (and the useMoveRelevanceWithUndo consumer) sees the right surface.
const mockMutateAsync = vi.fn(() => Promise.resolve());
const mockCreateMutate = vi.fn();

// Mock usePermissions hook
const mockPermissions = {
  isAuth: true,
  isModerator: true,
  isAdmin: false,
  isLeader: false,
  isUser: false,
  isTokenExpired: false
};
vi.mock('../../../../hooks', () => {
  // vi.mock is hoisted to the top of the file, so top-level module scope is
  // not yet initialised when this factory runs — hence the inline stub rather
  // than a shared `noop` const.
  const stubMutation = () => ({ mutate: vi.fn(), mutateAsync: vi.fn() });
  return {
    usePermissions: () => mockPermissions,
    useAnchorScroll: () => {},
    // ActionButtons disables itself offline; assume a connection here so the
    // reorder buttons stay clickable.
    useOnlineStatus: () => true,
    // SectionCreateButton reads the viewport to pick its icon-only mobile shape.
    useIsDesktopLayout: () => true,
    useMoveLocationRelevance: () => ({
      mutate: vi.fn(),
      mutateAsync: mockMutateAsync
    }),
    useCreateLocation: () => ({ mutate: mockCreateMutate }),
    // Location.jsx mounts these; the reorder test doesn't drive them, so
    // stubs suffice — but they must exist on the mock or vi throws on any
    // import miss.
    useUpdateLocation: stubMutation,
    useDeleteLocation: stubMutation,
    useRestoreLocation: stubMutation
  };
});

vi.mock('../../../common/Contribution/Contribution', () => {
  const MockContribution = () => <span>contribution</span>;
  return { default: MockContribution };
});

vi.mock('../Snapshots/UtilityFunction', () => ({
  SnapshotButton: () => <button type="button">Snapshot</button>,
  useSnapshotUrl: () => '/mock-snapshot-url'
}));

const messages = {
  'Move up': 'Move up',
  'Move down': 'Move down',
  Access: 'Access',
  Location: 'Location',
  'Cancel adding a new location': 'Cancel adding a new location',
  'Add a new location': 'Add a new location',
  Cancel: 'Cancel',
  New: 'New',
  'There is currently no location for this entrance.':
    'There is currently no location for this entrance.',
  'This entrance has a restricted access, you can not see its locations.':
    'This entrance has a restricted access.',
  deleted: 'deleted',
  edit: 'edit',
  delete: 'delete',
  Restore: 'Restore',
  restore: 'restore',
  Delete: 'Delete',
  'Permanently delete': 'Permanently delete',
  Edit: 'Edit',
  'Cancel edit': 'Cancel edit',
  'Loading ...': 'Loading ...',
  'Access the revision history page': 'Access the revision history page',
  'Order updated': 'Order updated',
  Undo: 'Undo',
  'Undo successful': 'Undo successful',
  'Copy link': 'Copy link',
  'Link copied!': 'Link copied!'
};

const locations = [
  {
    id: 1,
    relevance: 1,
    title: 'Location A',
    body: 'Body A',
    isDeleted: false,
    author: { id: 1, name: 'Test' },
    dateInscription: '2024-01-01'
  },
  {
    id: 2,
    relevance: 2,
    title: 'Location B',
    body: 'Body B',
    isDeleted: false,
    author: { id: 1, name: 'Test' },
    dateInscription: '2024-01-01'
  },
  {
    id: 3,
    relevance: 3,
    title: 'Location C',
    body: 'Body C',
    isDeleted: true,
    author: { id: 1, name: 'Test' },
    dateInscription: '2024-01-01'
  }
];

const renderLocations = (props = {}) =>
  render(
    <MemoryRouter>
      <IntlProvider locale="en" messages={messages}>
        <Locations
          entranceId={1}
          locations={locations}
          isEditAllowed
          {...props}
        />
      </IntlProvider>
    </MemoryRouter>
  );

beforeEach(() => {
  mockMutateAsync.mockClear();
  mockMutateAsync.mockReturnValue(Promise.resolve());
  mockCreateMutate.mockClear();
  mockPermissions.isAuth = true;
  mockPermissions.isModerator = true;
});

/**
 * Unit tests for entity list reorder integration
 * Validates: Requirements 2.4, 2.5, 3.1, 3.2
 */
describe('Locations reorder integration', () => {
  it('shows reorder controls on non-deleted locations for authenticated users', () => {
    renderLocations();

    const moveUpButtons = screen.getAllByLabelText('Move up');
    const moveDownButtons = screen.getAllByLabelText('Move down');

    // Boundary arrows are hidden: first active item has no up, last active has no down.
    // Location A (first active): down only. Location B (last active): up only.
    // Location C (deleted): no arrows.
    expect(moveUpButtons).toHaveLength(1);
    expect(moveDownButtons).toHaveLength(1);
  });

  it('hides reorder controls for unauthenticated users', () => {
    mockPermissions.isAuth = false;
    mockPermissions.isModerator = false;

    renderLocations();

    expect(screen.queryByLabelText('Move up')).toBeNull();
    expect(screen.queryByLabelText('Move down')).toBeNull();
  });

  it('hides reorder controls on deleted locations', () => {
    const allDeleted = locations.map(l => ({ ...l, isDeleted: true }));
    renderLocations({ locations: allDeleted });

    expect(screen.queryByLabelText('Move up')).toBeNull();
    expect(screen.queryByLabelText('Move down')).toBeNull();
  });

  it('calls the move mutation with direction -1 on up click', async () => {
    renderLocations();

    const moveUpButtons = screen.getAllByLabelText('Move up');
    // Click up on Location B (id=2) — the only visible up arrow (first item's up is hidden)
    await act(async () => {
      fireEvent.click(moveUpButtons[0]);
    });

    expect(mockMutateAsync).toHaveBeenCalledWith({ id: 2, direction: -1 });
  });

  it('calls the move mutation with direction 1 on down click', async () => {
    renderLocations();

    const moveDownButtons = screen.getAllByLabelText('Move down');
    // Click down on the first non-deleted location (Location A, id=1)
    await act(async () => {
      fireEvent.click(moveDownButtons[0]);
    });

    expect(mockMutateAsync).toHaveBeenCalledWith({ id: 1, direction: 1 });
  });
});
