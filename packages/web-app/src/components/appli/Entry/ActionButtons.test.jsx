import { render, screen, fireEvent, within, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import ActionButtons from './ActionButtons';

const messages = {
  'Move up': 'Move up',
  'Move down': 'Move down',
  'Loading ...': 'Loading ...',
  Restore: 'Restore',
  restore: 'restore',
  Delete: 'Delete',
  'Permanently delete': 'Permanently delete',
  delete: 'delete',
  Edit: 'Edit',
  'Cancel edit': 'Cancel edit',
  edit: 'edit',
  Cancel: 'Cancel',
  History: 'History'
};

const baseProps = {
  isLoading: false,
  isUpdating: false,
  setIsUpdating: vi.fn(),
  isDeleted: false,
  canEdit: true,
  canDelete: true,
  snapshotProps: { id: 1, type: 'descriptions' },
  onDeletePress: vi.fn(),
  onRestorePress: vi.fn()
};

const renderActionButtons = (props = {}) => {
  const client = new QueryClient();
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <IntlProvider locale="en" messages={messages}>
          <ActionButtons {...baseProps} {...props} />
        </IntlProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

it('requires explicit confirmation for subcontent soft deletion', async () => {
  const onDeletePress = vi.fn().mockResolvedValue({});
  renderActionButtons({ onDeletePress });
  fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
  expect(onDeletePress).not.toHaveBeenCalled();
  const dialog = within(screen.getByRole('dialog'));
  await act(async () =>
    fireEvent.click(dialog.getByRole('button', { name: 'Delete' }))
  );
  expect(onDeletePress).toHaveBeenCalledExactlyOnceWith(false);
});

it('does not infer permanent-delete rights from soft-delete rights', () => {
  renderActionButtons({ isDeleted: true, canDelete: true });
  expect(
    screen.queryByRole('button', { name: 'Permanently delete' })
  ).toBeNull();
  expect(screen.getByRole('button', { name: 'Restore' })).toBeVisible();
});

/**
 * Unit tests for ActionButtons reorder integration
 * Validates: Requirements 2.2, 2.3, 2.6, 2.7
 */
describe('ActionButtons reorder integration', () => {
  it('renders arrows inside ButtonGroup when reorder props are provided', () => {
    renderActionButtons({
      onMoveUp: vi.fn(),
      onMoveDown: vi.fn(),
      isFirst: false,
      isLast: false,
      isMoveLoading: false
    });

    expect(screen.getByLabelText('Move up')).toBeInTheDocument();
    expect(screen.getByLabelText('Move down')).toBeInTheDocument();
  });

  it('hides up arrow when isFirst is true', () => {
    renderActionButtons({
      onMoveUp: vi.fn(),
      onMoveDown: vi.fn(),
      isFirst: true,
      isLast: false,
      isMoveLoading: false
    });

    expect(screen.queryByLabelText('Move up')).toBeNull();
    expect(screen.getByLabelText('Move down')).toBeInTheDocument();
  });

  it('hides down arrow when isLast is true', () => {
    renderActionButtons({
      onMoveUp: vi.fn(),
      onMoveDown: vi.fn(),
      isFirst: false,
      isLast: true,
      isMoveLoading: false
    });

    expect(screen.getByLabelText('Move up')).toBeInTheDocument();
    expect(screen.queryByLabelText('Move down')).toBeNull();
  });

  it('shows spinner instead of arrows when isMoveLoading is true', () => {
    renderActionButtons({
      onMoveUp: vi.fn(),
      onMoveDown: vi.fn(),
      isFirst: false,
      isLast: false,
      isMoveLoading: true
    });

    expect(screen.queryByLabelText('Move up')).toBeNull();
    expect(screen.queryByLabelText('Move down')).toBeNull();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders no arrows when reorder props are absent', () => {
    renderActionButtons();

    expect(screen.queryByLabelText('Move up')).toBeNull();
    expect(screen.queryByLabelText('Move down')).toBeNull();
  });

  it('calls onMoveUp when up arrow is clicked', () => {
    const onMoveUp = vi.fn();
    renderActionButtons({
      onMoveUp,
      onMoveDown: vi.fn(),
      isFirst: false,
      isLast: false,
      isMoveLoading: false
    });

    fireEvent.click(screen.getByLabelText('Move up'));
    expect(onMoveUp).toHaveBeenCalledTimes(1);
  });

  it('calls onMoveDown when down arrow is clicked', () => {
    const onMoveDown = vi.fn();
    renderActionButtons({
      onMoveUp: vi.fn(),
      onMoveDown,
      isFirst: false,
      isLast: false,
      isMoveLoading: false
    });

    fireEvent.click(screen.getByLabelText('Move down'));
    expect(onMoveDown).toHaveBeenCalledTimes(1);
  });
});
