import { useEffect, useRef, useState } from 'react';

import { createEntranceClusterClient } from '@/utils/entranceClusterClient';

const EMPTY_COORDINATES = [];

const useEntranceClusters = (data, filters) => {
  const clientRef = useRef(null);
  const [state, setState] = useState({
    source: null,
    isPending: true,
    error: null
  });

  useEffect(() => {
    try {
      const client = createEntranceClusterClient(
        new Worker(
          new URL('../workers/entranceClusters.worker.js', import.meta.url),
          {
            type: 'module'
          }
        ),
        {
          onReady: source =>
            setState({ source, isPending: false, error: null }),
          onError: error => setState({ source: null, isPending: false, error })
        }
      );
      clientRef.current = client;
      return () => {
        clientRef.current = null;
        client.dispose();
      };
    } catch (error) {
      setState({ source: null, isPending: false, error });
      return undefined;
    }
  }, []);

  useEffect(() => {
    if (clientRef.current) {
      setState({ source: null, isPending: true, error: null });
      clientRef.current.update(data ?? EMPTY_COORDINATES, filters);
    }
  }, [data, filters]);

  return state;
};

export default useEntranceClusters;
