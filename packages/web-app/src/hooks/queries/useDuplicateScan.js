import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export const useDuplicateScan = ({ queryKey, load, enabled }) => {
  const queryClient = useQueryClient();
  const run = useRef(0);
  const busy = useRef(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [progress, setProgress] = useState({ loaded: 0, total: 0 });
  const query = useQuery({
    queryKey,
    enabled: false,
    retry: false,
    gcTime: 60 * 1000,
    queryFn: ({ signal }) =>
      load({
        signal,
        onProgress: value => {
          if (!signal.aborted) setProgress(value);
        }
      })
  });
  const cancel = () => {
    run.current += 1;
    busy.current = false;
    queryClient.cancelQueries({ queryKey, exact: true });
  };
  useEffect(() => {
    if (!enabled) {
      run.current += 1;
      busy.current = false;
      queryClient.cancelQueries({ queryKey, exact: true });
    }
    return () => {
      run.current += 1;
      busy.current = false;
      queryClient.cancelQueries({ queryKey, exact: true });
    };
  }, [enabled, queryClient, queryKey]);

  const analyze = async () => {
    if (!enabled || busy.current) return;
    busy.current = true;
    const currentRun = ++run.current;
    setHasStarted(true);
    setHasCompleted(false);
    setProgress({ loaded: 0, total: 0 });
    const result = await query.refetch();
    if (currentRun === run.current) {
      busy.current = false;
      if (result.isSuccess) setHasCompleted(true);
    }
  };
  return { query, hasStarted, hasCompleted, progress, analyze, cancel };
};
