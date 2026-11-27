import { analyzePersonDuplicates } from './analyzePersonDuplicates';

let workers;
beforeEach(() => {
  workers = [];
  vi.stubGlobal(
    'Worker',
    class {
      constructor() {
        workers.push(this);
      }

      postMessage = vi.fn();

      terminate = vi.fn();
    }
  );
});
afterEach(() => vi.unstubAllGlobals());

it('reports worker progress and releases the worker on completion', async () => {
  const onProgress = vi.fn();
  const result = analyzePersonDuplicates([], {
    signal: new AbortController().signal,
    onProgress
  });
  workers[0].onmessage({ data: { progress: { loaded: 1, total: 2 } } });
  expect(onProgress).toHaveBeenCalledWith({ loaded: 1, total: 2 });
  workers[0].onmessage({ data: { pairs: [] } });
  await expect(result).resolves.toEqual([]);
  expect(workers[0].terminate).toHaveBeenCalledOnce();
});

it('terminates cancelled work and ignores late messages', async () => {
  const controller = new AbortController();
  const onProgress = vi.fn();
  const result = analyzePersonDuplicates([], {
    signal: controller.signal,
    onProgress
  });
  controller.abort();
  workers[0].onmessage({ data: { progress: { loaded: 1, total: 2 } } });
  await expect(result).rejects.toThrow();
  expect(onProgress).not.toHaveBeenCalled();
  expect(workers[0].terminate).toHaveBeenCalledOnce();
});

it('surfaces worker errors without exposing internal error details', async () => {
  const result = analyzePersonDuplicates([], {
    signal: new AbortController().signal,
    onProgress: vi.fn()
  });
  workers[0].onerror({ message: 'Internal details' });
  await expect(result).rejects.toThrow('authorDuplicates.analysisFailed');
  expect(workers[0].terminate).toHaveBeenCalledOnce();
});
