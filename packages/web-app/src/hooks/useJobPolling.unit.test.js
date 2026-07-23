import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useJobPolling } from './useJobPolling';

const mockDispatch = vi.fn();
vi.mock('react-redux', () => ({
  useDispatch: () => mockDispatch
}));

const mockPollJobStatus = vi.fn();
vi.mock('../actions/ImportCsv', () => ({
  pollJobStatus: batchId => mockPollJobStatus(batchId)
}));

describe('useJobPolling', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockDispatch.mockReset();
    mockPollJobStatus.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does nothing when there is no batchId or polling is not active', () => {
    renderHook(() => useJobPolling(null, true));
    renderHook(() => useJobPolling('batch-1', false));
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('never has more than one request in flight, even when a tick takes longer than the interval', async () => {
    // Regression test: the previous setInterval-based design could fire a new
    // tick before a slow one resolved, delivering progress updates out of
    // order. This asserts only one dispatch is in flight at a time.
    let resolveTick;
    mockDispatch.mockImplementation(
      () =>
        new Promise(resolve => {
          resolveTick = resolve;
        })
    );

    renderHook(() => useJobPolling('batch-1', true, 3000));

    // First tick fires immediately on mount.
    expect(mockDispatch).toHaveBeenCalledTimes(1);

    // Advance well past the interval while the first tick is still pending:
    // no second tick should be scheduled/fired yet.
    await act(async () => {
      vi.advanceTimersByTime(10000);
    });
    expect(mockDispatch).toHaveBeenCalledTimes(1);

    // Resolve the slow tick, then only the interval delay schedules the next one.
    await act(async () => {
      resolveTick();
      await Promise.resolve();
    });
    expect(mockDispatch).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(3000);
    });
    expect(mockDispatch).toHaveBeenCalledTimes(2);
  });

  it('clears the pending timer and does not reschedule after unmount', async () => {
    mockDispatch.mockResolvedValue(undefined);

    const { unmount } = renderHook(() => useJobPolling('batch-1', true, 3000));

    await act(async () => {
      await Promise.resolve();
    });
    expect(mockDispatch).toHaveBeenCalledTimes(1);

    unmount();

    await act(async () => {
      vi.advanceTimersByTime(10000);
    });
    // No further ticks after unmount.
    expect(mockDispatch).toHaveBeenCalledTimes(1);
  });

  it('cancels a tick still in flight at unmount so it does not reschedule', async () => {
    let resolveTick;
    mockDispatch.mockImplementation(
      () =>
        new Promise(resolve => {
          resolveTick = resolve;
        })
    );

    const { unmount } = renderHook(() => useJobPolling('batch-1', true, 3000));
    expect(mockDispatch).toHaveBeenCalledTimes(1);

    unmount();

    // The in-flight tick resolves after unmount: it must not schedule a new one.
    await act(async () => {
      resolveTick();
      await Promise.resolve();
      vi.advanceTimersByTime(10000);
    });
    expect(mockDispatch).toHaveBeenCalledTimes(1);
  });
});
