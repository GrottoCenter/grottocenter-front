import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { renderWithProviders } from '@/test/renderWithProviders';
import messages from '@/../public/lang/en.json';
import Descriptions from '../Descriptions';
import Histories from '../Entry/Histories';
import Locations from '../Entry/Locations';

const { create, update, restore, permissions } = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  restore: vi.fn(),
  permissions: { isAuth: true, isModerator: true, isAdmin: false }
}));

vi.mock('@/hooks', () => {
  const createMutation = () => ({ mutate: create });
  const updateMutation = () => ({ mutate: update });
  const deleteMutation = () => ({ mutateAsync: vi.fn(), reset: vi.fn() });
  const restoreMutation = () => ({ mutate: restore });
  const moveMutation = () => ({ mutateAsync: vi.fn() });
  return {
    usePermissions: () => permissions,
    useAnchorScroll: () => {},
    useIsDesktopLayout: () => true,
    useOnlineStatus: () => true,
    useLanguages: () => ({
      isSuccess: true,
      data: [{ id: 'eng', refName: 'English' }]
    }),
    useCreateDescription: createMutation,
    useCreateHistory: createMutation,
    useCreateLocation: createMutation,
    useUpdateDescription: updateMutation,
    useUpdateHistory: updateMutation,
    useUpdateLocation: updateMutation,
    useDeleteDescription: deleteMutation,
    useDeleteHistory: deleteMutation,
    useDeleteLocation: deleteMutation,
    useRestoreDescription: restoreMutation,
    useRestoreHistory: restoreMutation,
    useRestoreLocation: restoreMutation,
    useMoveDescriptionRelevance: moveMutation,
    useMoveHistoryRelevance: moveMutation,
    useMoveLocationRelevance: moveMutation
  };
});

vi.mock('@/hooks/useMoveRelevanceWithUndo', () => ({
  useMoveRelevanceWithUndo: () => ({ movingId: null, handleMove: vi.fn() })
}));

// Exercise the domain wiring and edit lifecycle without involving modal/menus,
// whose own interactions are covered by ActionButtons.test.jsx.
vi.mock('../Entry/ActionButtons', () => ({
  default: ({
    canEdit,
    canDelete,
    isDeleted,
    isUpdating,
    setIsUpdating,
    onRestorePress,
    onMoveUp,
    onMoveDown,
    isFirst,
    isLast
  }) => (
    <>
      {canEdit && !isDeleted && !isUpdating && (
        <button type="button" onClick={() => setIsUpdating(true)}>
          Edit
        </button>
      )}
      {canDelete && isDeleted && (
        <button type="button" onClick={onRestorePress}>
          Restore
        </button>
      )}
      {onMoveUp && !isFirst && (
        <button type="button" onClick={onMoveUp}>
          Move up
        </button>
      )}
      {onMoveDown && !isLast && (
        <button type="button" onClick={onMoveDown}>
          Move down
        </button>
      )}
    </>
  )
}));

const cases = [
  {
    name: 'description',
    render: items => (
      <Descriptions entityType="entrance" entityId={12} descriptions={items} />
    )
  },
  {
    name: 'location',
    render: items => (
      <Locations entranceId={12} locations={items} isEditAllowed />
    )
  },
  {
    name: 'history',
    render: items => (
      <Histories entranceId={12} histories={items} isEditAllowed />
    )
  }
];

const items = [
  {
    id: 2,
    relevance: 2,
    title: 'Second',
    body: 'Second body',
    language: 'eng'
  },
  {
    id: 3,
    relevance: 0,
    title: 'Deleted',
    body: 'Deleted body',
    language: 'eng',
    isDeleted: true
  },
  { id: 1, relevance: 1, title: 'First', body: 'First body', language: 'eng' }
];

const renderSection = element =>
  renderWithProviders(<MemoryRouter>{element}</MemoryRouter>, { messages });

beforeEach(() => {
  vi.clearAllMocks();
  permissions.isAuth = true;
  permissions.isModerator = true;
  permissions.isAdmin = false;
});

describe.each(cases)('$name contribution section', ({ name, render }) => {
  it('preserves ordered items, active boundaries and restoration of deleted items', () => {
    renderSection(render(items));
    const rows = screen.getAllByRole('listitem');
    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveTextContent('Deleted body');
    expect(rows[1]).toHaveTextContent('First body');
    expect(rows[2]).toHaveTextContent('Second body');
    expect(within(rows[0]).queryByRole('button', { name: 'Edit' })).toBeNull();
    expect(
      within(rows[0]).queryByRole('button', { name: 'Move up' })
    ).toBeNull();
    expect(
      within(rows[1]).queryByRole('button', { name: 'Move up' })
    ).toBeNull();
    expect(
      within(rows[2]).queryByRole('button', { name: 'Move down' })
    ).toBeNull();
    expect(
      within(rows[1]).getByRole('button', { name: 'Move down' })
    ).toBeVisible();
    expect(
      within(rows[2]).getByRole('button', { name: 'Move up' })
    ).toBeVisible();
    fireEvent.click(within(rows[0]).getByRole('button', { name: 'Restore' }));
    expect(restore).toHaveBeenCalledWith({ id: 3 });
  });

  it('opens the create form and preserves the domain submission payload', async () => {
    renderSection(render([]));
    fireEvent.click(screen.getByRole('button', { name: 'New' }));
    const body = screen.getByRole('textbox', { name: /Text/ });
    fireEvent.change(body, { target: { value: 'New body' } });
    const title = screen.queryByRole('textbox', { name: /Title/ });
    if (title) fireEvent.change(title, { target: { value: 'New title' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    await waitFor(() => expect(create).toHaveBeenCalledOnce());
    expect(create).toHaveBeenCalledWith({
      entrance: 12,
      body: 'New body',
      language: 'eng',
      ...(name === 'history' ? {} : { title: 'New title' })
    });
    expect(screen.queryByRole('textbox', { name: /Text/ })).toBeNull();
  });

  it('cancels inline editing without writing, then saves the existing item', async () => {
    renderSection(render([items[2]]));
    const readingBody = screen.getByText('First body');
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(screen.getByRole('textbox', { name: /Text/ })).toHaveValue(
      'First body'
    );
    expect(readingBody).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByText('First body')).toBeVisible();
    expect(update).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.change(screen.getByRole('textbox', { name: /Text/ }), {
      target: { value: 'Edited body' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Update' }));
    await waitFor(() => expect(update).toHaveBeenCalledOnce());
    expect(update).toHaveBeenCalledWith({
      id: 1,
      body: 'Edited body',
      language: 'eng',
      ...(name === 'history' ? {} : { title: 'First' })
    });
    expect(screen.queryByRole('textbox', { name: /Text/ })).toBeNull();
  });
});

it('retains sensitive access restrictions and permits administrators to add', () => {
  const element = (
    <Locations entranceId={12} locations={[]} isSensitive isEditAllowed />
  );
  const { rerender } = renderSection(element);
  fireEvent.click(screen.getByRole('button', { name: 'Access' }));
  expect(screen.queryByRole('button', { name: 'New' })).toBeNull();
  expect(
    screen.getByText(
      'This entrance has a restricted access, you can not see its locations.'
    )
  ).toBeVisible();
  permissions.isAdmin = true;
  rerender(
    <MemoryRouter>
      <Locations entranceId={12} locations={[]} isSensitive isEditAllowed />
    </MemoryRouter>
  );
  expect(screen.getByRole('button', { name: 'New' })).toBeVisible();
});
