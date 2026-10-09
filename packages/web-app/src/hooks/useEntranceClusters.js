import { useEffect, useRef, useState } from 'react';

import { createEntranceClusterClient } from '@/utils/entranceClusterClient';

const EMPTY_COORDINATES = [];

const useEntranceClusters = (data, filters) => {
  const clientRef = useRef(null);
  const dataRef = useRef(null);
  const [state, setState] = useState({
    source: null,
    isPending: true,
    error: null,
    hasCriteria: null
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
          onReady: (source, hasCriteria) =>
            setState({ source, isPending: false, error: null, hasCriteria }),
          onError: error =>
            setState(previous => ({
              ...previous,
              source: null,
              isPending: false,
              error
            }))
        }
      );
      clientRef.current = client;
      return () => {
        clientRef.current = null;
        client.dispose();
      };
    } catch (error) {
      setState(previous => ({
        ...previous,
        source: null,
        isPending: false,
        error
      }));
      return undefined;
    }
  }, []);

  useEffect(() => {
    if (clientRef.current) {
      const coordinates = data ?? EMPTY_COORDINATES;
      const hasDataChanged = dataRef.current !== coordinates;
      dataRef.current = coordinates;
      // Keep the format result while only filters change. null means that a
      // new dataset has not been checked yet, rather than a legacy cache.
      setState(previous => ({
        ...previous,
        source: null,
        isPending: true,
        error: null,
        hasCriteria: hasDataChanged ? null : previous.hasCriteria
      }));
      clientRef.current.update(coordinates, filters);
    }
  }, [data, filters]);

  return state;
};

export default useEntranceClusters;
