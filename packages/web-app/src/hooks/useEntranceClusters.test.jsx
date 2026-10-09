import { StrictMode } from 'react';
import { act, renderHook } from '@testing-library/react';

import useEntranceClusters from './useEntranceClusters';

describe('useEntranceClusters lifecycle', () => {
  const workers = [];
  let isUnavailable = false;

  beforeEach(() => {
    workers.length = 0;
    isUnavailable = false;
    class WorkerDouble extends EventTarget {
      postMessage = vi.fn();

      terminate = vi.fn();

      constructor() {
        super();
        if (isUnavailable) throw new Error('Worker unavailable');
        workers.push(this);
      }
    }
    vi.stubGlobal('Worker', WorkerDouble);
  });

  afterEach(() => vi.unstubAllGlobals());

  it('terminates the StrictMode trial worker, reuses the live worker and ignores disposed replies', () => {
    const data = [[5.5, 45.5, 1, 0, null]];
    const { result, rerender, unmount } = renderHook(
      ({ filters }) => useEntranceClusters(data, filters),
      { wrapper: StrictMode, initialProps: { filters: { minInterest: 0 } } }
    );
    expect(workers).toHaveLength(2);
    expect(workers[0].terminate).toHaveBeenCalledOnce();
    expect(result.current.isPending).toBe(true);
    act(() =>
      workers[0].dispatchEvent(
        new MessageEvent('message', {
          data: { type: 'ready', revision: 1, hasCriteria: false }
        })
      )
    );
    expect(result.current.source).toBeNull();
    expect(result.current.hasCriteria).toBeNull();
    act(() =>
      workers[1].dispatchEvent(
        new MessageEvent('message', {
          data: { type: 'ready', revision: 1, hasCriteria: true }
        })
      )
    );
    expect(result.current.source).not.toBeNull();
    expect(result.current.hasCriteria).toBe(true);
    rerender({ filters: { minInterest: 8 } });
    expect(workers).toHaveLength(2);
    expect(result.current.source).toBeNull();
    expect(result.current.hasCriteria).toBe(true);
    expect(workers[1].postMessage).toHaveBeenLastCalledWith({
      type: 'build',
      revision: 2,
      filters: { minInterest: 8 }
    });
    unmount();
    expect(workers[1].terminate).toHaveBeenCalledOnce();
  });

  it('reports a construction failure without leaving a pending indicator', () => {
    isUnavailable = true;
    const { result } = renderHook(() => useEntranceClusters([], {}));
    expect(result.current.error.message).toBe('Worker unavailable');
    expect(result.current.isPending).toBe(false);
  });

  it('refreshes cache compatibility when coordinates are replaced, not when filters change', () => {
    const filters = { minInterest: 0 };
    const { result, rerender } = renderHook(
      ({ data }) => useEntranceClusters(data, filters),
      { initialProps: { data: [[5.5, 45.5]] } }
    );
    const ready = (revision, hasCriteria) =>
      act(() =>
        workers[0].dispatchEvent(
          new MessageEvent('message', {
            data: { type: 'ready', revision, hasCriteria }
          })
        )
      );
    ready(1, false);
    expect(result.current.hasCriteria).toBe(false);
    rerender({ data: [[5.5, 45.5, 1, 0, null]] });
    expect(result.current.hasCriteria).toBeNull();
    ready(2, true);
    expect(result.current.hasCriteria).toBe(true);
  });
});
