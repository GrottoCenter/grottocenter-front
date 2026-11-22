import { act, renderHook } from '@testing-library/react';
import { useGeometrySimplification } from './useGeometrySimplification';

const geometry = {
  type: 'MultiPolygon',
  coordinates: [
    [
      [
        [0, 0],
        [1, 0],
        [0, 1],
        [0, 0]
      ]
    ]
  ]
};
const sliderParams = {
  maxTolerance: 0.01,
  step: 0.0001,
  minAchievableCount: 4
};

let workers;

beforeEach(() => {
  vi.useFakeTimers();
  workers = [];
  vi.stubGlobal(
    'Worker',
    class {
      constructor() {
        this.postMessage = vi.fn();
        this.terminate = vi.fn();
        workers.push(this);
      }
    }
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const reply = (worker, message = worker.postMessage.mock.lastCall[0]) => {
  act(() => {
    worker.onmessage({
      data: {
        requestId: message.requestId,
        tolerance: message.tolerance,
        ...(message.type === 'load' && { sliderParams }),
        simplifiedData: geometry,
        vertexCount: 4
      }
    });
  });
};

const debounce = () => act(() => vi.advanceTimersByTime(100));

it('does not simplify a second time after loading', () => {
  const { result } = renderHook(() => useGeometrySimplification(geometry));
  reply(workers[0]);
  debounce();
  expect(workers[0].postMessage).toHaveBeenCalledTimes(1);
  expect(result.current.simplifiedData).toBe(geometry);
  expect(result.current.isAnalyzing).toBe(false);
  expect(result.current.isSimplifying).toBe(false);
});

it('keeps its worker across inline callbacks and calls the latest on error', () => {
  const onError = vi.fn();
  const { rerender } = renderHook(
    ({ label }) =>
      useGeometrySimplification(geometry, message => onError(label, message)),
    { initialProps: { label: 'initial' } }
  );
  reply(workers[0]);
  rerender({ label: 'latest' });
  expect(workers).toHaveLength(1);
  expect(workers[0].terminate).not.toHaveBeenCalled();
  act(() => workers[0].onerror({ message: 'failed' }));
  expect(onError).toHaveBeenCalledExactlyOnceWith('latest', 'failed');
});

it('cancels a debounced change when returning to the completed tolerance', () => {
  const { result } = renderHook(() => useGeometrySimplification(geometry));
  reply(workers[0]);
  act(() => result.current.updateTolerance(0.001));
  expect(result.current.isSimplifying).toBe(true);
  act(() => result.current.updateTolerance(0));
  debounce();
  expect(result.current.isSimplifying).toBe(false);
  expect(workers[0].postMessage).toHaveBeenCalledTimes(1);
});

it('resets and simplifies again with the same geometry, even at tolerance zero', () => {
  const { result } = renderHook(() => useGeometrySimplification(geometry));
  const worker = workers[0];
  reply(worker);
  act(() => result.current.reset());
  expect(result.current.isSimplifying).toBe(true);
  expect(worker.postMessage.mock.lastCall[0]).toMatchObject({
    type: 'simplify',
    tolerance: 0
  });
  reply(worker);
  act(() => result.current.updateTolerance(0.001));
  debounce();
  reply(worker);
  expect(workers).toHaveLength(1);
  expect(result.current.tolerance).toBe(0.001);
  expect(result.current.isSimplifying).toBe(false);
  expect(result.current.simplifiedData).toBe(geometry);
});

it('ignores an in-flight simplification after reset and restores tolerance zero', () => {
  const { result } = renderHook(() => useGeometrySimplification(geometry));
  const worker = workers[0];
  reply(worker);
  act(() => result.current.updateTolerance(0.001));
  debounce();
  const staleMessage = worker.postMessage.mock.lastCall[0];
  act(() => result.current.reset());
  reply(worker, staleMessage);
  expect(result.current.simplifiedData).toBeNull();
  expect(result.current.isSimplifying).toBe(true);
  debounce();
  expect(worker.postMessage.mock.lastCall[0]).toMatchObject({
    type: 'simplify',
    tolerance: 0
  });
  reply(worker);
  expect(result.current.tolerance).toBe(0);
  expect(result.current.isSimplifying).toBe(false);
});

it('preserves a pending load when resetting before analysis finishes', () => {
  const { result } = renderHook(() => useGeometrySimplification(geometry));
  act(() => result.current.reset());
  reply(workers[0]);
  expect(result.current.isAnalyzing).toBe(false);
  expect(result.current.sliderParams).toEqual(sliderParams);
  act(() => result.current.updateTolerance(0.001));
  debounce();
  reply(workers[0]);
  expect(result.current.isSimplifying).toBe(false);
  expect(workers[0].postMessage).toHaveBeenCalledTimes(2);
});

it('applies a tolerance selected during analysis once the load completes', () => {
  const { result } = renderHook(() => useGeometrySimplification(geometry));
  const worker = workers[0];
  act(() => result.current.updateTolerance(0.001));
  debounce();
  reply(worker);
  expect(result.current.isAnalyzing).toBe(false);
  expect(worker.postMessage.mock.lastCall[0]).toMatchObject({
    type: 'simplify',
    tolerance: 0.001
  });
  reply(worker);
  expect(result.current.isSimplifying).toBe(false);
});

it('clears the worker readiness when geometry is removed', () => {
  const { result, rerender } = renderHook(
    ({ data }) => useGeometrySimplification(data),
    { initialProps: { data: geometry } }
  );
  reply(workers[0]);
  rerender({ data: null });
  act(() => result.current.reset());
  expect(result.current.isAnalyzing).toBe(false);
  expect(result.current.isSimplifying).toBe(false);
  expect(result.current.simplifiedData).toBeNull();
  expect(workers[0].terminate).toHaveBeenCalledOnce();
});

it('replaces the worker and resets tolerance when the geometry changes', () => {
  const { result, rerender, unmount } = renderHook(
    ({ data }) => useGeometrySimplification(data),
    { initialProps: { data: geometry } }
  );
  const previousWorker = workers[0];
  reply(previousWorker);
  act(() => result.current.updateTolerance(0.001));
  debounce();
  const staleMessage = previousWorker.postMessage.mock.lastCall[0];
  rerender({ data: { ...geometry } });
  expect(previousWorker.terminate).toHaveBeenCalledOnce();
  reply(previousWorker, staleMessage);
  expect(result.current.simplifiedData).toBeNull();
  reply(workers[1]);
  debounce();
  expect(result.current.tolerance).toBe(0);
  expect(workers[1].postMessage).toHaveBeenCalledTimes(1);
  unmount();
  expect(workers[1].terminate).toHaveBeenCalledOnce();
});
