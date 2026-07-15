import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import Locations from './index';

// Mock react-redux with a controllable dispatch
const mockDispatch = vi.fn(() => Promise.resolve());
vi.mock('react-redux', async () => ({
  ...(await vi.importActual('react-redux')),
  useDispatch: () => mockDispatch,
  useSelector: () => ({})
}));

// Mock the moveLocationRelevance action creator
const mockMoveLocationRelevance = vi.fn((id, direction) => ({
  type: 'MOVE_LOCATION_RELEVANCE',
  id,
  direction
}));
vi.mock('../../../../actions/Location/MoveRelevance', () => ({
  moveLocationRelevance: (...args) => mockMoveLocationRelevance(...args)
}));

// Mock usePermissions hook
const mockPermissions = {
  isAuth: true,
  isModerator: true,
  isAdmin: false,
  isLeader: false,
  isUser: false,
  isTokenExpired: false
};
vi.mock('../../../../hooks', () => ({
  usePermissions: () => mockPermissions,
  useAnchorScroll: () => {}
}));

vi.mock('../../../../actions/Location/CreateLocation', () => ({
  postLocation: vi.fn(() => ({ type: 'POST_LOCATION' }))
}));

vi.mock('../../../common/Contribution/Contribution', () => {
  const MockContribution = () => <span>contribution</span>;
  return { default: MockContribution };
});

vi.mock('../Snapshots/UtilityFunction', () => ({
  SnapshotButton: () => <button type="button">Snapshot</button>
}));

const messages = {
  'Move up': 'Move up',
  'Move down': 'Move down',
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
    <IntlProvider locale="en" messages={messages}>
      <Locations
        entranceId={1}
        locations={locations}
        isEditAllowed
        {...props}
      />
    </IntlProvider>
  );

beforeEach(() => {
  mockDispatch.mockClear();
  mockDispatch.mockReturnValue(Promise.resolve());
  mockMoveLocationRelevance.mockClear();
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

  it('dispatches moveLocationRelevance with direction -1 on up click', async () => {
    renderLocations();

    const moveUpButtons = screen.getAllByLabelText('Move up');
    // Click up on Location B (id=2) — the only visible up arrow (first item's up is hidden)
    await act(async () => {
      fireEvent.click(moveUpButtons[0]);
    });

    expect(mockMoveLocationRelevance).toHaveBeenCalledWith(2, -1);
  });

  it('dispatches moveLocationRelevance with direction 1 on down click', async () => {
    renderLocations();

    const moveDownButtons = screen.getAllByLabelText('Move down');
    // Click down on the first non-deleted location (Location A, id=1)
    await act(async () => {
      fireEvent.click(moveDownButtons[0]);
    });

    expect(mockMoveLocationRelevance).toHaveBeenCalledWith(1, 1);
  });
});
