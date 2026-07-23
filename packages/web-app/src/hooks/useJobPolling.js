import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { pollJobStatus } from '../actions/ImportCsv';

// Uses a recursive setTimeout instead of setInterval: it only schedules the
// next tick once the previous request has resolved, so slow responses (the
// exact case this async import queue exists for) never overlap and cannot
// deliver progress updates out of order.
export const useJobPolling = (batchId, isPolling, intervalMs = 3000) => {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!batchId || !isPolling) return undefined;

    let timeoutId;
    let cancelled = false;

    const tick = () => {
      dispatch(pollJobStatus(batchId)).finally(() => {
        if (!cancelled) timeoutId = setTimeout(tick, intervalMs);
      });
    };

    tick();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [dispatch, batchId, isPolling, intervalMs]);
};

useJobPolling.propTypes = {
  batchId: PropTypes.string,
  isPolling: PropTypes.bool.isRequired,
  intervalMs: PropTypes.number
};
