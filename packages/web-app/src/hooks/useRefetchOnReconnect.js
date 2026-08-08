import { useEffect, useRef } from 'react';
import { useOnlineStatus } from './useOnlineStatus';

/**
 * Runs `refetch` when the connection comes back, and only then.
 *
 * This is what replaces a Retry button while offline: pressing one is
 * guaranteed to fail, so instead of offering a dead control we repair the view
 * ourselves the moment the network returns. A user who lost signal mid-read
 * finds the page filled in rather than an error waiting for a click.
 *
 * Never fires on mount — only on an actual offline → online transition.
 *
 * @param {Function} refetch - called with no argument on reconnection
 * @param {boolean} [enabled=true] - skip while there is nothing to repair
 */
export const useRefetchOnReconnect = (refetch, enabled = true) => {
  const isOnline = useOnlineStatus();
  const hasBeenOffline = useRef(false);
  // Kept in a ref so an inline arrow function (the common call site) doesn't
  // re-run the effect on every render and refetch in a loop.
  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;

  useEffect(() => {
    if (!isOnline) {
      hasBeenOffline.current = true;
      return;
    }
    if (!hasBeenOffline.current) return;
    hasBeenOffline.current = false;
    if (enabled) refetchRef.current?.();
  }, [isOnline, enabled]);
};

export default useRefetchOnReconnect;
