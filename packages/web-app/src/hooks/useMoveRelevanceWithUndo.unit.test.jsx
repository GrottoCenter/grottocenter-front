import { renderHook, act } from '@testing-library/react';
import { useMoveRelevanceWithUndo } from './useMoveRelevanceWithUndo';

const mockEnqueueSnackbar = vi.fn();
const mockCloseSnackbar = vi.fn();
vi.mock('notistack', () => ({
  useSnackbar: () => ({
    enqueueSnackbar: mockEnqueueSnackbar,
    closeSnackbar: mockCloseSnackbar
  })
}));

vi.mock('react-intl', () => ({
  useIntl: () => ({
    formatMessage: ({ id }) => id
  })
}));

vi.mock('@mui/material', () => ({
  Link: ({ children, onClick }) => (
    <a href="#undo" onClick={onClick}>
      {children}
    </a>
  )
}));

const createMockMutation = () => ({
  mutateAsync: vi.fn().mockResolvedValue({})
});

beforeEach(() => {
  vi.clearAllMocks();
});

/**
 * Unit tests for useMoveRelevanceWithUndo hook
 * Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5, 9.6
 */
describe('useMoveRelevanceWithUndo', () => {
  it('shows success snackbar after successful move', async () => {
    const mutation = createMockMutation();
    const { result } = renderHook(() => useMoveRelevanceWithUndo(mutation));

    await act(async () => {
      result.current.handleMove(1, -1);
    });

    expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
      'Order updated',
      expect.objectContaining({ variant: 'success' })
    );
  });

  it('snackbar contains an Undo action button', async () => {
    const mutation = createMockMutation();
    const { result } = renderHook(() => useMoveRelevanceWithUndo(mutation));

    await act(async () => {
      result.current.handleMove(1, -1);
    });

    const call = mockEnqueueSnackbar.mock.calls[0];
    const options = call[1];
    expect(options.action).toBeDefined();

    // The action prop is a render function that receives a snackbarId
    const actionElement = options.action('snackbar-1');
    expect(actionElement).toBeTruthy();
    expect(actionElement.props.children).toBe('Undo');
  });

  it('snackbar auto-dismiss is configured to 6000ms', async () => {
    const mutation = createMockMutation();
    const { result } = renderHook(() => useMoveRelevanceWithUndo(mutation));

    await act(async () => {
      result.current.handleMove(1, -1);
    });

    expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
      'Order updated',
      expect.objectContaining({ autoHideDuration: 6000 })
    );
  });

  it('clicking Undo dispatches move with opposite direction', async () => {
    const mutation = createMockMutation();
    const { result } = renderHook(() => useMoveRelevanceWithUndo(mutation));

    await act(async () => {
      result.current.handleMove(1, -1);
    });

    // Extract the undo button's onClick
    const actionFn = mockEnqueueSnackbar.mock.calls[0][1].action;
    const actionElement = actionFn('snackbar-1');

    mutation.mutateAsync.mockClear();

    await act(async () => {
      actionElement.props.onClick();
    });

    // Original direction was -1, undo should be 1 (opposite)
    expect(mutation.mutateAsync).toHaveBeenCalledWith({
      id: 1,
      direction: 1
    });
    expect(mockCloseSnackbar).toHaveBeenCalledWith('snackbar-1');
  });

  it('undo success shows confirmation snackbar', async () => {
    const mutation = createMockMutation();
    const { result } = renderHook(() => useMoveRelevanceWithUndo(mutation));

    await act(async () => {
      result.current.handleMove(1, 1);
    });

    const actionFn = mockEnqueueSnackbar.mock.calls[0][1].action;
    const actionElement = actionFn('snackbar-1');

    mockEnqueueSnackbar.mockClear();
    await act(async () => {
      actionElement.props.onClick();
    });

    expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
      'Undo successful',
      expect.objectContaining({
        variant: 'success',
        autoHideDuration: 3000
      })
    );
  });

  it('shows error snackbar and no success snackbar when move fails', async () => {
    const mutation = createMockMutation();
    mutation.mutateAsync.mockRejectedValue(new Error('Cannot move further'));
    const { result } = renderHook(() => useMoveRelevanceWithUndo(mutation));

    await act(async () => {
      result.current.handleMove(1, -1);
    });

    expect(mockEnqueueSnackbar).toHaveBeenCalledTimes(1);
    expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
      'Cannot move further',
      expect.objectContaining({ variant: 'error' })
    );
  });

  it('shows error snackbar and no undo-success snackbar when undo fails', async () => {
    const mutation = createMockMutation();
    const { result } = renderHook(() => useMoveRelevanceWithUndo(mutation));

    await act(async () => {
      result.current.handleMove(1, 1);
    });

    const actionFn = mockEnqueueSnackbar.mock.calls[0][1].action;
    const actionElement = actionFn('snackbar-1');

    mockEnqueueSnackbar.mockClear();
    mutation.mutateAsync.mockRejectedValueOnce(new Error('Undo failed'));

    await act(async () => {
      actionElement.props.onClick();
    });

    expect(mockEnqueueSnackbar).toHaveBeenCalledTimes(1);
    expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ variant: 'error' })
    );
  });
});
