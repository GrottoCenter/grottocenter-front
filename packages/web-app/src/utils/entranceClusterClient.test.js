import { createEntranceClusterClient } from './entranceClusterClient';

const setup = () => {
  const listeners = new Map();
  const worker = {
    postMessage: vi.fn(),
    terminate: vi.fn(),
    addEventListener: (type, listener) => listeners.set(type, listener),
    removeEventListener: type => listeners.delete(type)
  };
  const onReady = vi.fn();
  const onError = vi.fn();
  const client = createEntranceClusterClient(worker, { onReady, onError });
  const emit = data => listeners.get('message')?.({ data });
  return { client, worker, onReady, onError, emit, listeners };
};

describe('entrance cluster client', () => {
  it('coalesces rapid filters and copies unchanged coordinates only once', () => {
    const { client, worker, onReady, emit } = setup();
    const data = [[0, 0, 1, 0, null]];
    client.update(data, { minInterest: 0 });
    client.update(data, { minInterest: 5 });
    client.update(data, { minInterest: 8 });
    expect(worker.postMessage).toHaveBeenCalledTimes(1);
    emit({ type: 'ready', revision: 1 });
    expect(onReady).not.toHaveBeenCalled();
    expect(worker.postMessage).toHaveBeenLastCalledWith({
      type: 'build',
      revision: 3,
      filters: { minInterest: 8 }
    });
    emit({ type: 'ready', revision: 3, hasCriteria: true });
    expect(onReady).toHaveBeenCalledTimes(1);
    expect(onReady.mock.lastCall[1]).toBe(true);
  });

  it('sends the latest replacement dataset after an in-flight build', () => {
    const { client, worker, emit } = setup();
    client.update([[0, 0]], {});
    client.update([[1, 1]], {});
    const latest = [[2, 2]];
    client.update(latest, {});
    emit({ type: 'ready', revision: 1 });
    expect(worker.postMessage).toHaveBeenLastCalledWith({
      type: 'build',
      revision: 3,
      data: latest,
      filters: {}
    });
  });

  it('queries clusters and expansion and cancels queries when filters change', async () => {
    const { client, worker, onReady, emit } = setup();
    const data = [[0, 0]];
    client.update(data, {});
    emit({ type: 'ready', revision: 1 });
    const source = onReady.mock.calls[0][0];
    const request = source.getClusters([-1, -1, 1, 1], 8);
    const query = worker.postMessage.mock.lastCall[0];
    emit({
      type: 'result',
      revision: 1,
      requestId: query.requestId,
      result: ['cluster']
    });
    await expect(request).resolves.toEqual(['cluster']);
    const expansion = source.getClusterExpansionZoom(18);
    expect(worker.postMessage.mock.lastCall[0].clusterId).toBe(18);
    client.update(data, { minInterest: 5 });
    await expect(expansion).resolves.toBeNull();
    await expect(source.getClusters([-1, -1, 1, 1], 8)).resolves.toBeNull();
  });

  it('settles pending requests and detaches/terminates on disposal', async () => {
    const { client, worker, onReady, emit, listeners } = setup();
    client.update([], {});
    emit({ type: 'ready', revision: 1 });
    const request = onReady.mock.calls[0][0].getClusters([], 0);
    client.dispose();
    await expect(request).resolves.toBeNull();
    expect(listeners.size).toBe(0);
    expect(worker.terminate).toHaveBeenCalledTimes(1);
    client.update([], {});
    expect(worker.postMessage).toHaveBeenCalledTimes(2);
  });

  it('reports build failures and can rebuild with subsequent filters', () => {
    const { client, onReady, onError, emit } = setup();
    client.update([], {});
    emit({ type: 'error', revision: 1, message: 'Build failed' });
    expect(onError).toHaveBeenCalledWith(new Error('Build failed'));
    expect(onReady).not.toHaveBeenCalled();
    client.update([], {});
    emit({ type: 'ready', revision: 2 });
    expect(onReady).toHaveBeenCalledTimes(1);
  });

  it('settles pending requests on a fatal worker error', async () => {
    const { client, onReady, onError, emit, listeners } = setup();
    client.update([], {});
    emit({ type: 'ready', revision: 1 });
    const request = onReady.mock.calls[0][0].getClusters([], 0);
    listeners.get('error')({ message: 'Worker crashed' });
    await expect(request).resolves.toBeNull();
    expect(onError).toHaveBeenCalledWith(new Error('Worker crashed'));
    client.update([], {});
    expect(onError).toHaveBeenCalledTimes(2);
  });
});
