import { renderHook, act } from '@testing-library/react';
import { useMoveRelevanceWithUndo } from './useMoveRelevanceWithUndo';

// Mock dependencies
const mockDispatch = jest.fn();
jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch
}));

const mockEnqueueSnackbar = jest.fn();
const mockCloseSnackbar = jest.fn();
jest.mock('notistack', () => ({
  useSnackbar: () => ({
    enqueueSnackbar: mockEnqueueSnackbar,
    closeSnackbar: mockCloseSnackbar
  })
}));

jest.mock('react-intl', () => ({
  useIntl: () => ({
    formatMessage: ({ id }) => id
  })
}));

jest.mock('@mui/material', () => ({
  Link: ({ children, onClick }) => (
    <a href="#undo" onClick={onClick}>
      {children}
    </a>
  )
}));

const successResult = {
  moved: { id: 1, relevance: 2 },
  swapped: { id: 2, relevance: 1 }
};

const failureResult = {
  error: { type: 400, message: 'Cannot move further' }
};

const createMockThunk = (result = successResult) => {
  const thunk = jest.fn((id, direction) => () => Promise.resolve(result));
  return thunk;
};

beforeEach(() => {
  jest.clearAllMocks();
  mockDispatch.mockImplementation(thunkFn => {
    if (typeof thunkFn === 'function') {
      return thunkFn();
    }
    return Promise.resolve(thunkFn);
  });
});

/**
 * Unit tests for useMoveRelevanceWithUndo hook
 * Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5, 9.6
 */
describe('useMoveRelevanceWithUndo', () => {
  it('shows success snackbar after successful move', async () => {
    const mockThunk = createMockThunk();
    const { result } = renderHook(() =>
      useMoveRelevanceWithUndo(mockThunk)
    );

    await act(async () => {
      result.current.handleMove(1, -1);
    });

    expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
      'Order updated',
      expect.objectContaining({ variant: 'success' })
    );
  });

  it('snackbar contains an Undo action button', async () => {
    const mockThunk = createMockThunk();
    const { result } = renderHook(() =>
      useMoveRelevanceWithUndo(mockThunk)
    );

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
    const mockThunk = createMockThunk();
    const { result } = renderHook(() =>
      useMoveRelevanceWithUndo(mockThunk)
    );

    await act(async () => {
      result.current.handleMove(1, -1);
    });

    expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
      'Order updated',
      expect.objectContaining({ autoHideDuration: 6000 })
    );
  });

  it('clicking Undo dispatches move with opposite direction', async () => {
    const mockThunk = createMockThunk();
    const { result } = renderHook(() =>
      useMoveRelevanceWithUndo(mockThunk)
    );

    await act(async () => {
      result.current.handleMove(1, -1);
    });

    // Extract the undo button's onClick
    const actionFn = mockEnqueueSnackbar.mock.calls[0][1].action;
    const actionElement = actionFn('snackbar-1');

    mockThunk.mockClear();
    mockDispatch.mockClear();
    mockDispatch.mockImplementation(thunkFn => {
      if (typeof thunkFn === 'function') {
        return thunkFn();
      }
      return Promise.resolve(thunkFn);
    });

    await act(async () => {
      actionElement.props.onClick();
    });

    // Original direction was -1, undo should be 1 (opposite)
    expect(mockThunk).toHaveBeenCalledWith(1, 1);
    expect(mockCloseSnackbar).toHaveBeenCalledWith('snackbar-1');
  });

  it('undo success shows confirmation snackbar', async () => {
    const mockThunk = createMockThunk();
    const { result } = renderHook(() =>
      useMoveRelevanceWithUndo(mockThunk)
    );

    await act(async () => {
      result.current.handleMove(1, 1);
    });

    const actionFn = mockEnqueueSnackbar.mock.calls[0][1].action;
    const actionElement = actionFn('snackbar-1');

    mockEnqueueSnackbar.mockClear();
    mockDispatch.mockImplementation(thunkFn => {
      if (typeof thunkFn === 'function') {
        return thunkFn();
      }
      return Promise.resolve(thunkFn);
    });

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
    const mockThunk = createMockThunk(failureResult);
    const { result } = renderHook(() =>
      useMoveRelevanceWithUndo(mockThunk)
    );

    await act(async () => {
      result.current.handleMove(1, -1);
    });

    expect(mockEnqueueSnackbar).toHaveBeenCalledTimes(1);
    expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ variant: 'error' })
    );
  });

  it('shows error snackbar and no undo-success snackbar when undo fails', async () => {
    const mockThunk = createMockThunk();
    const { result } = renderHook(() =>
      useMoveRelevanceWithUndo(mockThunk)
    );

    await act(async () => {
      result.current.handleMove(1, 1);
    });

    const actionFn = mockEnqueueSnackbar.mock.calls[0][1].action;
    const actionElement = actionFn('snackbar-1');

    mockEnqueueSnackbar.mockClear();
    mockDispatch.mockImplementation(() =>
      Promise.resolve(failureResult)
    );

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
