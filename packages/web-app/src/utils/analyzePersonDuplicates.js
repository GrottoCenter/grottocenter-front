export const analyzePersonDuplicates = (persons, { signal, onProgress }) =>
  new Promise((resolve, reject) => {
    signal.throwIfAborted();
    const worker = new Worker(
      new URL('../workers/personDuplicates.worker.js', import.meta.url),
      { type: 'module' }
    );
    let handleAbort;
    let hasFinished = false;
    const finish = (callback, value) => {
      if (hasFinished) return;
      hasFinished = true;
      worker.terminate();
      signal.removeEventListener('abort', handleAbort);
      callback(value);
    };
    handleAbort = () => finish(reject, signal.reason);
    signal.addEventListener('abort', handleAbort, { once: true });
    worker.onmessage = ({ data }) => {
      if (signal.aborted || hasFinished) return;
      if (data.progress) onProgress(data.progress);
      if (data.pairs) finish(resolve, data.pairs);
    };
    worker.onerror = () =>
      finish(reject, new Error('authorDuplicates.analysisFailed'));
    worker.onmessageerror = worker.onerror;
    try {
      worker.postMessage(persons);
    } catch (error) {
      finish(reject, error);
    }
  });
