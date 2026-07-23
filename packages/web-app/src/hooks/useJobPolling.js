import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import {
  pollJobStatus,
  importRowsPollFailure,
  POLL_FAILED_ERROR
} from '../actions/ImportCsv';

// Give up on the polling loop only after this many consecutive failed ticks, so
// a single transient network blip or malformed response body does not abort an
// import that is otherwise progressing fine.
const MAX_CONSECUTIVE_ERRORS = 3;

/**
 * Poll an async import job until it reaches a terminal state.
 *
 * Uses a recursive setTimeout instead of setInterval: the next tick is only
 * scheduled once the previous request has resolved, so slow responses (the
 * exact case this async import queue exists for) never overlap and cannot
 * deliver progress updates out of order.
 *
 * @param {?string} batchId - Job batch id to poll; polling is a no-op while null.
 * @param {boolean} isPolling - Whether polling is active (driven by the store).
 * @param {number} [intervalMs=3000] - Delay between a tick resolving and the next.
 */
export const useJobPolling = (batchId, isPolling, intervalMs = 3000) => {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!batchId || !isPolling) return undefined;

    let timeoutId;
    let cancelled = false;
    let consecutiveErrors = 0;

    const stop = () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };

    const tick = () => {
      dispatch(pollJobStatus(batchId)).then(outcome => {
        if (cancelled) return;

        if (outcome === 'terminal') {
          // The dispatched success/failure action already flips isPolling off;
          // stop here too so no phantom timeout is scheduled while we wait for
          // the store-driven re-render to tear the effect down.
          stop();
          return;
        }

        if (outcome === 'error') {
          consecutiveErrors += 1;
          if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
            dispatch(importRowsPollFailure(POLL_FAILED_ERROR));
            stop();
            return;
          }
        } else {
          consecutiveErrors = 0;
        }

        timeoutId = setTimeout(tick, intervalMs);
      });
    };

    tick();

    return stop;
  }, [dispatch, batchId, isPolling, intervalMs]);
};
