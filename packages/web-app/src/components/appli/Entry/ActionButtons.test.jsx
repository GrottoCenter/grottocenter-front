import { render, screen, fireEvent } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
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
  Cancel: 'Cancel'
};

const baseProps = {
  isLoading: false,
  isUpdating: false,
  setIsUpdating: vi.fn(),
  isDeleted: false,
  canEdit: true,
  canDelete: true,
  snapshotEl: <button type="button">Snapshot</button>,
  onDeletePress: vi.fn(),
  onRestorePress: vi.fn()
};

const renderActionButtons = (props = {}) =>
  render(
    <IntlProvider locale="en" messages={messages}>
      <ActionButtons {...baseProps} {...props} />
    </IntlProvider>
  );

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
