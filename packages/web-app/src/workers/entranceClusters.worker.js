import { createEntranceClusterEngine } from '@/utils/entranceClusterEngine';

const handleMessage = createEntranceClusterEngine();

globalThis.onmessage = ({ data }) => {
  try {
    globalThis.postMessage(handleMessage(data));
  } catch (error) {
    globalThis.postMessage({
      type: 'error',
      revision: data.revision,
      requestId: data.requestId,
      message: error.message
    });
  }
};
