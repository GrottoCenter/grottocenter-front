import { StrictMode } from 'react';
import { act, renderHook } from '@testing-library/react';

import {
  DEFAULT_ENTRANCE_FILTERS,
  DEFAULT_QUALITY_FILTERS
} from '@/utils/entranceMapFilters';
import useEntranceClusters from './useEntranceClusters';

const defaultFilters = {
  sizes: DEFAULT_ENTRANCE_FILTERS,
  qualities: DEFAULT_QUALITY_FILTERS,
  minInterest: 0
};
const coordinates = [
  [5.5, 45.5, 1, 0, null],
  [5.5001, 45.5001, 3, 70, 8]
];
const WORLD = [-180, -85, 180, 85];

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
    expect(result.current.source.getClusters(WORLD, 10)).toEqual([]);
  });

  it('keeps filtering, expansion and data updates working without a Worker', () => {
    isUnavailable = true;
    const { result, rerender } = renderHook(
      ({ data, filters }) => useEntranceClusters(data, filters),
      { initialProps: { data: coordinates, filters: defaultFilters } }
    );
    const clusters = result.current.source.getClusters(WORLD, 10);
    expect(clusters[0].properties.point_count).toBe(2);
    expect(
      result.current.source.getClusterExpansionZoom(
        clusters[0].properties.cluster_id
      )
    ).toBe(13);
    rerender({
      data: coordinates,
      filters: { ...defaultFilters, minInterest: 8 }
    });
    expect(result.current.source.getClusters(WORLD, 10)).toHaveLength(1);
    expect(
      result.current.source.getClusters(WORLD, 10)[0].properties.pointId
    ).toBe(1);
    rerender({ data: [[6, 46]], filters: defaultFilters });
    expect(result.current.hasCriteria).toBe(false);
    expect(result.current.source.getClusters(WORLD, 10)).toHaveLength(1);
    expect(result.current.isPending).toBe(false);
  });

  it.each([false, true])(
    'falls back after an asynchronous Worker failure (index ready: %s)',
    isReady => {
      const { result, rerender } = renderHook(
        ({ filters }) => useEntranceClusters(coordinates, filters),
        { initialProps: { filters: defaultFilters } }
      );
      if (isReady) {
        act(() =>
          workers[0].dispatchEvent(
            new MessageEvent('message', {
              data: { type: 'ready', revision: 1, hasCriteria: true }
            })
          )
        );
      }
      const message = 'Worker failed';
      act(() => workers[0].dispatchEvent(new ErrorEvent('error', { message })));
      expect(result.current.error.message).toBe(message);
      expect(result.current.isPending).toBe(false);
      expect(result.current.hasCriteria).toBe(true);
      expect(
        result.current.source.getClusters(WORLD, 10)[0].properties.point_count
      ).toBe(2);
      const { source } = result.current;
      rerender({ filters: defaultFilters });
      expect(result.current.source).toBe(source);
      rerender({ filters: { ...defaultFilters, minInterest: 8 } });
      expect(result.current.source.getClusters(WORLD, 10)).toHaveLength(1);
      expect(
        result.current.source.getClusters(WORLD, 10)[0].properties.pointId
      ).toBe(1);
      expect(result.current.isPending).toBe(false);
    }
  );

  it('falls back when posting a build fails', () => {
    const { result, rerender } = renderHook(
      ({ filters }) => useEntranceClusters(coordinates, filters),
      { initialProps: { filters: defaultFilters } }
    );
    workers[0].postMessage.mockImplementation(() => {
      throw new Error('Cannot post a build');
    });
    // Complete the initial build so the next update posts immediately.
    act(() =>
      workers[0].dispatchEvent(
        new MessageEvent('message', {
          data: { type: 'ready', revision: 1, hasCriteria: true }
        })
      )
    );
    rerender({ filters: { ...defaultFilters, minInterest: 8 } });
    expect(result.current.error.message).toBe('Cannot post a build');
    expect(result.current.source.getClusters(WORLD, 10)).toHaveLength(1);
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
