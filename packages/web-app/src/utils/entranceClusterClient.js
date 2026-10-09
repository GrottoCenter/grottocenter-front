// Only one build is sent at a time. While the worker computes synchronously,
// retain the newest desired build here instead of filling its message queue.
export const createEntranceClusterClient = (worker, { onReady, onError }) => {
  let revision = 0;
  let nextRequestId = 0;
  let isBuilding = false;
  let isDisposed = false;
  let pendingBuild = null;
  let sentData = null;
  let workerError = null;
  const requests = new Map();

  const cancelRequests = () => {
    requests.forEach(resolve => resolve(null));
    requests.clear();
  };

  const sendBuild = () => {
    if (isDisposed || isBuilding || !pendingBuild) return;
    const { data, filters } = pendingBuild;
    pendingBuild = null;
    const message = { type: 'build', revision, filters };
    if (data !== sentData) message.data = data;
    try {
      worker.postMessage(message);
      sentData = data;
      isBuilding = true;
    } catch (error) {
      onError(error);
    }
  };

  const query = (type, parameters, sourceRevision) => {
    if (isDisposed || isBuilding || sourceRevision !== revision)
      return Promise.resolve(null);
    const requestId = ++nextRequestId;
    return new Promise(resolve => {
      requests.set(requestId, resolve);
      try {
        worker.postMessage({
          type,
          ...parameters,
          revision: sourceRevision,
          requestId
        });
      } catch (error) {
        requests.delete(requestId);
        resolve(null);
        onError(error);
      }
    });
  };

  const handleMessage = ({ data: message }) => {
    if (isDisposed) return;
    if (message.type === 'ready' || message.type === 'error') {
      if (message.requestId == null) {
        isBuilding = false;
        if (message.revision === revision) {
          if (message.type === 'ready') {
            const sourceRevision = revision;
            onReady(
              {
                getClusters: (bounds, zoom) =>
                  query('clusters', { bounds, zoom }, sourceRevision),
                getClusterExpansionZoom: clusterId =>
                  query('expansion', { clusterId }, sourceRevision)
              },
              message.hasCriteria
            );
          } else {
            onError(new Error(message.message));
          }
        }
        sendBuild();
        return;
      }
    }
    const resolve = requests.get(message.requestId);
    if (!resolve) return;
    requests.delete(message.requestId);
    resolve(message.revision === revision ? (message.result ?? null) : null);
    if (message.type === 'error') onError(new Error(message.message));
  };

  const handleError = event => {
    isBuilding = false;
    pendingBuild = null;
    cancelRequests();
    workerError = new Error(event.message || 'Entrance cluster worker failed');
    onError(workerError);
  };

  worker.addEventListener('message', handleMessage);
  worker.addEventListener('error', handleError);

  return {
    update: (data, filters) => {
      if (isDisposed) return;
      if (workerError) {
        onError(workerError);
        return;
      }
      revision++;
      cancelRequests();
      pendingBuild = { data, filters };
      sendBuild();
    },
    dispose: () => {
      isDisposed = true;
      pendingBuild = null;
      sentData = null;
      cancelRequests();
      worker.removeEventListener('message', handleMessage);
      worker.removeEventListener('error', handleError);
      worker.terminate();
    }
  };
};
