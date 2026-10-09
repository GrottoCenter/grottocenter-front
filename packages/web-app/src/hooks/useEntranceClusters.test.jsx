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
          data: { type: 'ready', revision: 1 }
        })
      )
    );
    expect(result.current.source).toBeNull();
    act(() =>
      workers[1].dispatchEvent(
        new MessageEvent('message', {
          data: { type: 'ready', revision: 1 }
        })
      )
    );
    expect(result.current.source).not.toBeNull();
    rerender({ filters: { minInterest: 8 } });
    expect(workers).toHaveLength(2);
    expect(result.current.source).toBeNull();
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
});
